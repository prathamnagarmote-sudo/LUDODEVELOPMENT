import { useDispatch, useStore } from 'react-redux';
import {
  deactivateAllTokens,
  lockToken,
  setIsAnyTokenMoving,
  setTokenAlignmentData,
} from '../state/slices/playersSlice';
import { type TCoordinate } from '../types';
import { type TToken } from '../types';
import { ERRORS } from '../utils/errors';
import { areCoordsEqual } from '../game/coords/logic';
import { useCoordsToPosition } from './useCoordsToPosition';
import type { RootState } from '../state/store';
import { setTokenTransitionTime } from '../utils/setTokenTransitionTime';
import { useCallback } from 'react';
import {
  BACKWARD_TOKEN_TRANSITION_TIME,
  FORWARD_TOKEN_TRANSITION_TIME,
} from '../game/tokens/constants';
import { defaultTokenAlignmentData } from '../game/tokens/alignment';
import { TOKEN_SAFE_COORDINATES } from '../game/tokens/constants';
import { getTokenDOMId, tokensWithCoord } from '../game/tokens/logic';
import { tokenPaths } from '../game/tokens/paths';
import { sleep } from '../utils/sleep';
import { registerCaptureCancelFn } from './useMoveTokenForward';
import { playReverseSound, stopReverseSound, stopReverseSoundWithFade } from '../utils/audio';
import styles from '../pages/Play/components/Token/Token.module.css';

export function useCaptureTokenInSameCoord() {
  const dispatch = useDispatch();
  const getPosition = useCoordsToPosition();
  const store = useStore<RootState>();

  return useCallback(
    (capturingToken: TToken, latestCoord: TCoordinate): Promise<boolean> => {
      return new Promise((resolve) => {
        if (capturingToken.isLocked)
          throw new Error(ERRORS.lockedToken(capturingToken.colour, capturingToken.id));
        const players = store.getState().players.players;

        if (TOKEN_SAFE_COORDINATES.find((c) => areCoordsEqual(c, latestCoord)))
          return resolve(false);

        const capturableTokens = tokensWithCoord(latestCoord, players).filter(
          (t) => t.colour !== capturingToken.colour
        );

        if (capturableTokens.length === 0) return resolve(false);

        capturableTokens.forEach(({ colour, id }) => {
          dispatch(
            setTokenAlignmentData({ colour, id, newAlignmentData: defaultTokenAlignmentData })
          );
        });
        dispatch(
          setTokenAlignmentData({
            colour: capturingToken.colour,
            id: capturingToken.id,
            newAlignmentData: defaultTokenAlignmentData,
          })
        );
        dispatch(deactivateAllTokens(capturingToken.colour));
        dispatch(setIsAnyTokenMoving(true));
        let isFirstCapture = true;
        let tokensSuccessfullyCaptured = 0;
        let captureCancelled = false;
        // Register cancel function so the global timer expiry can abort this animation
        registerCaptureCancelFn(() => {
          captureCancelled = true;
          dispatch(setIsAnyTokenMoving(false));
          resolve(false);
        });
        (async () => {
          try {
            for (const t of capturableTokens) {
              if (captureCancelled) break;
              const { colour, id, coordinates } = t;
              setTokenTransitionTime(BACKWARD_TOKEN_TRANSITION_TIME, t);
              const tokenPath = tokenPaths[colour];
              const tokenEl = document.getElementById(getTokenDOMId(colour, id));
              if (!tokenEl) throw new Error(ERRORS.tokenDoesNotExist(colour, id));
              const initialCoordinateIndex = tokenPath.findIndex((v) =>
                areCoordsEqual(v, coordinates)
              );
              let index = initialCoordinateIndex;
              let startTime = 0;

              const handleTransitionEnd = () => {
                try {
                  if (captureCancelled) {
                    tokenEl.removeEventListener('transitionend', handleTransitionEnd);
                    dispatch(setIsAnyTokenMoving(false));
                    stopReverseSound();
                    const bouncerEl = tokenEl.querySelector('span');
                    if (bouncerEl) {
                      bouncerEl.classList.remove(styles.hopper);
                    }
                    return;
                  }
                  index--;
                  if (index < 0) {
                    setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, t);
                    dispatch(lockToken({ colour, id }));
                    tokenEl.removeEventListener('transitionend', handleTransitionEnd);
                    // Use the new fade out logic, ensuring a min 500ms playtime
                    stopReverseSoundWithFade(startTime);
                    
                    const bouncerEl = tokenEl.querySelector('span');
                    if (bouncerEl) {
                      bouncerEl.classList.remove(styles.hopper);
                    }

                    tokensSuccessfullyCaptured++;
                    if (tokensSuccessfullyCaptured === capturableTokens.length) {
                      dispatch(setIsAnyTokenMoving(false));
                      resolve(true);
                    }
                    return;
                  }

                  // Trigger hop animation on the bouncer element for this backward step
                  const bouncerEl = tokenEl.querySelector('span');
                  if (bouncerEl) {
                    bouncerEl.classList.remove(styles.hopper);
                    void bouncerEl.offsetWidth; // Force layout reflow to restart animation keyframes
                    bouncerEl.classList.add(styles.hopper);
                  }

                  const { x, y } = getPosition(tokenPath[index], defaultTokenAlignmentData);
                  tokenEl.style.transform = `translate(${x}, ${y})`;
                } catch (transitionErr) {
                  console.error('[CAPTURE] Error during transitionend handler:', transitionErr);
                  tokenEl.removeEventListener('transitionend', handleTransitionEnd);
                  dispatch(setIsAnyTokenMoving(false));
                  resolve(false);
                }
              };
              // Trigger the first transition
              if (isFirstCapture) isFirstCapture = false;
              else await sleep(250);
              
              // Play reverse sound, passing the distance so it can slow down for long kills
              startTime = Date.now();
              playReverseSound(initialCoordinateIndex);
              
              index--;

              // Trigger hop animation on the bouncer element for the first backward step
              const bouncerEl = tokenEl.querySelector('span');
              if (bouncerEl) {
                bouncerEl.classList.remove(styles.hopper);
                void bouncerEl.offsetWidth; // Force layout reflow to restart animation keyframes
                bouncerEl.classList.add(styles.hopper);
              }

              const { x, y } = getPosition(tokenPath[index], defaultTokenAlignmentData);
              tokenEl.style.transform = `translate(${x}, ${y})`;
              tokenEl.addEventListener('transitionend', handleTransitionEnd);
            }
          } catch (animErr) {
            console.error('[CAPTURE] Exception during capture animation loop:', animErr);
            dispatch(setIsAnyTokenMoving(false));
            resolve(false);
          }
        })();
      });
    },
    [dispatch, getPosition, store]
  );
}
