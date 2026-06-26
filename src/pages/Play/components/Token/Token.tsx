import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { deactivateAllTokens, setIsAnyTokenMoving } from '../../../../state/slices/playersSlice';
import { type TPlayerColour, type TTokenClickData } from '../../../../types';
import { type TToken } from '../../../../types';
import { useDispatch, useSelector } from 'react-redux';
import { OnlineGameContext } from '../Game/Game';
import type { AppDispatch, RootState } from '../../../../state/store';
import { toast } from 'react-toastify';
import TokenImage from '../../../../assets/token.svg?react';
import { useCoordsToPosition } from '../../../../hooks/useCoordsToPosition';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { useMoveAndCaptureToken } from '../../../../hooks/useMoveAndCaptureToken';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../../../../game/tokens/constants';
import { changeTurnThunk } from '../../../../state/thunks/changeTurnThunk';
import { setDiceNumberDirect } from '../../../../state/slices/diceSlice';
import { TokenCelebration } from './TokenCelebration';
import { getVisualColour } from '../../../../utils/colourMapping';

import styles from './Token.module.css';
import clsx from 'clsx';
import { getTokenDOMId } from '../../../../game/tokens/logic';
import { isCoordASafeSpot } from '../../../../game/coords/logic';

const woodStainColours: Record<TPlayerColour, string> = {
  red: 'url(#token-grad-red)',
  green: 'url(#token-grad-green)',
  blue: 'url(#token-grad-blue)',
  yellow: 'url(#token-grad-yellow)',
};

type Props = {
  colour: TPlayerColour;
  id: number;
  tokenClickData: TTokenClickData | null;
};



function Token({ colour, id, tokenClickData }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { boardTileSize, tokenHeight, tokenWidth } = useSelector((state: RootState) => state.board);
  const player = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)
  );
  const token = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)?.tokens.find((t) => t.id === id)
  ) as TToken;
  const numberOfConsecutiveSix = useSelector((state: RootState) =>
    state.players.players.find((p) => p.colour === colour)?.numberOfConsecutiveSix ?? 0
  );

  const tokenClickDataRef = useRef(tokenClickData);
  const [isCurrentlyFocused, setIsCurrentlyFocused] = useState(false);
  const tokenElRef = useRef<HTMLButtonElement | null>(null);

  const { coordinates, isActive, isLocked, tokenAlignmentData, hasTokenReachedHome } = token || {
    coordinates: { x: 0, y: 0 },
    isActive: false,
    isLocked: false,
    tokenAlignmentData: { scaleFactor: 1 },
    hasTokenReachedHome: false,
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const prevReachedHome = useRef(hasTokenReachedHome);

  const [isTransitionDisabled, setIsTransitionDisabled] = useState(true);

  useEffect(() => {
    if (boardTileSize > 0) {
      // Wait a tiny bit after the board size is known before enabling transitions
      // so the initial snap to position happens instantly without flying across the board.
      const timer = setTimeout(() => setIsTransitionDisabled(false), 50);
      return () => clearTimeout(timer);
    }
  }, [boardTileSize]);

  useEffect(() => {
    if (hasTokenReachedHome && !prevReachedHome.current) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
    prevReachedHome.current = hasTokenReachedHome;
  }, [hasTokenReachedHome]);

  const prevCoordsRef = useRef(coordinates);
  const hopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevCoordsRef.current;
    if (coordinates.x !== prev.x || coordinates.y !== prev.y) {
      // Coordinates changed: trigger hop animation.
      const bouncerEl = tokenElRef.current?.querySelector('span');
      if (bouncerEl) {
        // Clear any existing hop timeout to prevent stacking.
        if (hopTimeoutRef.current !== null) {
          clearTimeout(hopTimeoutRef.current);
        }
        
        // Remove the class, force a reflow, and add it back to guarantee keyframe restart
        bouncerEl.classList.remove(styles.hopper);
        void bouncerEl.offsetWidth; // Force layout reflow
        bouncerEl.classList.add(styles.hopper);
        
        hopTimeoutRef.current = setTimeout(() => {
          bouncerEl.classList.remove(styles.hopper);
          hopTimeoutRef.current = null;
        }, FORWARD_TOKEN_TRANSITION_TIME + 50);
      }
    }
    prevCoordsRef.current = coordinates;
  }, [coordinates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hopTimeoutRef.current !== null) clearTimeout(hopTimeoutRef.current);
    };
  }, []);

  const { scaleFactor } = tokenAlignmentData;
  const isSafeSpot = isCoordASafeSpot(coordinates);
  
  let localBouncePx = 8;
  let localHopPx = 20;

  // The user specifically requested the increased/scaled hopping ONLY for 
  // groups of tokens (scaleFactor < 1) resting on star safe spots.
  // Tokens at home or outside should just use standard unscaled 8px/20px hops.
  if (isSafeSpot && scaleFactor < 1) {
    localBouncePx = 16 / scaleFactor;
    localHopPx = 20 / scaleFactor;
  }

  const getPosition = useCoordsToPosition();
  const { x, y } = getPosition(coordinates, tokenAlignmentData, hasTokenReachedHome, colour);
  const diceNumber = useSelector((state: RootState) =>
    state.dice.dice.find((d) => d.colour === colour)
  )?.diceNumber;
  const moveAndCapture = useMoveAndCaptureToken();

  const onlineContext = useContext(OnlineGameContext);
  const visualColour = getVisualColour(colour, !!onlineContext?.isOnline, onlineContext?.myPlayerColour);

  const unlock = () => {
    dispatch(setIsAnyTokenMoving(true));
    setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
    dispatch(unlockAndAlignTokens({ colour, id }));
    dispatch(deactivateAllTokens(colour));
    // NOTE: Do NOT reset diceNumber to -1 here.
    // In online mode the server's TURN_CHANGE (OpCode 203) handles the dice reset
    // authoritatively. Resetting here causes the cube to snap to face-1 before
    // the next roll begins, which is the dice-reset-to-1 bug.
    setTimeout(() => {
      dispatch(setIsAnyTokenMoving(false));
    }, FORWARD_TOKEN_TRANSITION_TIME);
  };

  // OFFLINE-only: full token move including post-move turn change logic.
  // In ONLINE mode, turn changes come EXCLUSIVELY from OpCode 203 — never from local logic.
  const executeTokenMoveOffline = useCallback(async () => {
    if (!isActive || diceNumber === -1 || !diceNumber) return;

    const moveData = await moveAndCapture(token, diceNumber);
    if (!moveData) return;
    const { hasTokenReachedHome, isCaptured, hasPlayerWon } = moveData;
    if (hasPlayerWon) return dispatch(changeTurnThunk(moveAndCapture));
    if ((diceNumber !== 6 || numberOfConsecutiveSix >= 3) && !isCaptured && !hasTokenReachedHome) {
      // Turn changes: changeTurnThunk already resets the NEXT player's dice to -1 internally.
      return dispatch(changeTurnThunk(moveAndCapture));
    }
    // Same player gets another roll (rolled 6, captured, or reached home).
    // Reset dice to -1 so the turn arrow reappears.
    dispatch(setDiceNumberDirect({ colour, diceNumber: -1 }));
  }, [colour, diceNumber, dispatch, isActive, moveAndCapture, numberOfConsecutiveSix, token]);

  useEffect(() => {
    const prevClickData = tokenClickDataRef.current;
    const newTokenClickData = tokenClickData;

    if (!newTokenClickData || prevClickData?.timestamp === newTokenClickData.timestamp) return;
    tokenClickDataRef.current = newTokenClickData;

    if (newTokenClickData.colour === colour && newTokenClickData.id === id) {
      if (onlineContext?.isOnline) {
        if (isActive && diceNumber !== -1 && diceNumber) {
          if (colour === onlineContext.myPlayerColour) {
            dispatch(deactivateAllTokens(colour));
            try {
              onlineContext.onTokenMove?.(colour, id, isLocked);
              const moveKey = `${colour}_${id}`;
              onlineContext.optimisticTokenMovesRef?.current.add(moveKey);
              if (isLocked) {
                dispatch(setIsAnyTokenMoving(true));
                setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
                dispatch(unlockAndAlignTokens({ colour, id }));
                const animPromise = new Promise<void>((resolve) => {
                  setTimeout(() => {
                    dispatch(setIsAnyTokenMoving(false));
                    resolve();
                  }, FORWARD_TOKEN_TRANSITION_TIME);
                });
                if (onlineContext.activeTokenAnimationPromiseRef) {
                  // eslint-disable-next-line
                  onlineContext.activeTokenAnimationPromiseRef.current = animPromise;
                }
              } else {
                const animPromise = moveAndCapture(token, diceNumber);
                if (onlineContext.activeTokenAnimationPromiseRef) {
                  // eslint-disable-next-line
                  onlineContext.activeTokenAnimationPromiseRef.current = animPromise;
                }
              }
            } catch (err) {
              console.error("Failed to execute token move:", err);
              toast.error("Failed to sync token move with server.");
            }
          }
        }
      } else {
        executeTokenMoveOffline();
      }
    }
  }, [colour, executeTokenMoveOffline, id, tokenClickData, onlineContext, isLocked, isActive, diceNumber, dispatch, moveAndCapture, token]);

  const handleTokenClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    tokenElRef.current?.blur?.();
    if (onlineContext?.isOnline) {
      if (isActive && diceNumber !== -1 && diceNumber) {
        if (colour === onlineContext.myPlayerColour) {
          dispatch(deactivateAllTokens(colour));
          try {
            onlineContext.onTokenMove?.(colour, id, isLocked);
            const moveKey = `${colour}_${id}`;
            onlineContext.optimisticTokenMovesRef?.current.add(moveKey);
            if (isLocked) {
              dispatch(setIsAnyTokenMoving(true));
              setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
              dispatch(unlockAndAlignTokens({ colour, id }));
              const animPromise = new Promise<void>((resolve) => {
                setTimeout(() => {
                  dispatch(setIsAnyTokenMoving(false));
                  resolve();
                }, FORWARD_TOKEN_TRANSITION_TIME);
              });
              if (onlineContext.activeTokenAnimationPromiseRef) {
                // eslint-disable-next-line
                onlineContext.activeTokenAnimationPromiseRef.current = animPromise;
              }
            } else {
              const animPromise = moveAndCapture(token, diceNumber);
              if (onlineContext.activeTokenAnimationPromiseRef) {
                // eslint-disable-next-line
                onlineContext.activeTokenAnimationPromiseRef.current = animPromise;
              }
            }
          } catch (err) {
            console.error("Failed to execute token move:", err);
            toast.error("Failed to sync token move with server.");
          }
        }
      }
    } else {
      if (isLocked && isActive && diceNumber !== -1 && diceNumber) unlock();
      executeTokenMoveOffline();
    }
  };

  if (!player || player.hasQuit) return null;

  return (
    <button
      id={getTokenDOMId(colour, id)}
      className={clsx(styles.token)}
      tabIndex={isActive ? undefined : -1}
      onFocus={() => setIsCurrentlyFocused(true)}
      onBlur={() => setIsCurrentlyFocused(false)}
      disabled={!isActive}
      ref={tokenElRef}
      onClick={handleTokenClick}
      style={
        {
          '--token-height': `${tokenHeight}px`,
          '--token-width': `${tokenWidth}px`,
          '--fill-colour': woodStainColours[visualColour],
          '--bounce-height': `-${localBouncePx}px`,
          '--hop-height': `-${localHopPx}px`,
          zIndex: isActive ? 20 : 10,
          ...(isTransitionDisabled ? { '--token-transition-time': '0ms' } : {}),
          transform: `translate3d(${x}, ${y}, 12px) scale(${scaleFactor})`,
          opacity: player.hasQuit ? 0.55 : 1,
          filter: player.hasQuit ? 'grayscale(35%)' : undefined,
          pointerEvents: player.hasQuit ? 'none' : undefined,
        } as React.CSSProperties
      }
    >
      <TokenCelebration show={showCelebration} />
      <span
          className={clsx(styles.bouncer, {
            [styles.active]: isActive && !isCurrentlyFocused,
          })}
        >
        <TokenImage
          className={styles.svg}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

export default React.memo(Token);
