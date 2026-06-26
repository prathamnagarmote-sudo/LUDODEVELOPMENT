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

        let captureCancelled = false;

        // Register cancel function so the global timer expiry can abort this animation
        registerCaptureCancelFn(() => {
          captureCancelled = true;
          dispatch(setIsAnyTokenMoving(false));
          resolve(false);
        });

        // Animate one captured token stepping backward to its paddock using pure setTimeout.
        // This is 100% reliable unlike transitionend which can be dropped on mobile/background tabs.
        const animateSingleCapture = (t: TToken): Promise<void> => {
          return new Promise<void>((resolveSingle) => {
            const { colour, id, coordinates } = t;
            const tokenPath = tokenPaths[colour];
            const tokenEl = document.getElementById(getTokenDOMId(colour, id));
            if (!tokenEl) {
              resolveSingle();
              return;
            }

            const initialCoordinateIndex = tokenPath.findIndex((v) =>
              areCoordsEqual(v, coordinates)
            );

            // If token is already at or before index 0, lock immediately
            if (initialCoordinateIndex <= 0) {
              setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, t);
              dispatch(lockToken({ colour, id }));
              resolveSingle();
              return;
            }

            const startTime = Date.now();
            playReverseSound(initialCoordinateIndex);

            // Remove hopper class before starting
            const cleanHop = (el: Element | null) => {
              if (!el) return;
              el.classList.remove(styles.hopper);
              void (el as HTMLElement).offsetWidth; // Force reflow to restart keyframes
              el.classList.add(styles.hopper);
            };

            let currentIndex = initialCoordinateIndex;

            const step = () => {
              if (captureCancelled) {
                stopReverseSound();
                const bEl = tokenEl.querySelector('span');
                if (bEl) bEl.classList.remove(styles.hopper);
                resolveSingle();
                return;
              }

              currentIndex--;

              if (currentIndex < 0) {
                // Token reached paddock — lock and finish
                setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, t);
                dispatch(lockToken({ colour, id }));
                stopReverseSoundWithFade(startTime);
                const bEl = tokenEl.querySelector('span');
                if (bEl) bEl.classList.remove(styles.hopper);
                resolveSingle();
                return;
              }

              // Move one step backward
              setTokenTransitionTime(BACKWARD_TOKEN_TRANSITION_TIME, t);
              cleanHop(tokenEl.querySelector('span'));
              const { x, y } = getPosition(tokenPath[currentIndex], defaultTokenAlignmentData);
              tokenEl.style.transform = `translate(${x}, ${y})`;

              // Schedule next step with setTimeout — guaranteed to fire
              setTimeout(step, BACKWARD_TOKEN_TRANSITION_TIME);
            };

            // Kick off first step
            setTokenTransitionTime(BACKWARD_TOKEN_TRANSITION_TIME, t);
            cleanHop(tokenEl.querySelector('span'));
            currentIndex--; // Move to initialCoordinateIndex - 1
            if (currentIndex < 0) {
              // Already at home — lock immediately
              setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, t);
              dispatch(lockToken({ colour, id }));
              stopReverseSoundWithFade(startTime);
              resolveSingle();
              return;
            }
            const { x: x0, y: y0 } = getPosition(tokenPath[currentIndex], defaultTokenAlignmentData);
            tokenEl.style.transform = `translate(${x0}, ${y0})`;
            setTimeout(step, BACKWARD_TOKEN_TRANSITION_TIME);
          });
        };

        (async () => {
          try {
            let isFirstCapture = true;
            let totalCaptured = 0;
            for (const t of capturableTokens) {
              if (captureCancelled) break;
              if (!isFirstCapture) await sleep(250);
              isFirstCapture = false;
              await animateSingleCapture(t);
              totalCaptured++;
            }
            if (!captureCancelled) {
              dispatch(setIsAnyTokenMoving(false));
              resolve(totalCaptured > 0);
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
