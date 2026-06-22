import React, { useEffect, useRef, createContext, useMemo, useState, useCallback } from 'react';
import {
  registerNewPlayer,
  setPlayerSequence,
  setPlayerSequenceDirect,
  setCurrentPlayerColour,
  activateTokens,
  deactivateAllTokens,
  deactivateTokensOfAllPlayers,
  setIsAnyTokenMoving,
  declareForfeit,
  incrementNumberOfConsecutiveSix,
  resetNumberOfConsecutiveSix,
  lockToken,
  unlockToken,
  changeCoordsOfToken,
  markTokenAsReachedHome,
  convertPlayerToBot,
  quitMatch,
  setPlayerMissedTurns,
} from '../../../../state/slices/playersSlice';
import { type TPlayerColour } from '../../../../types';
import Board from '../Board/Board';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../state/store';
import { registerDice, setDiceNumberDirect, setIsPlaceholderShowing, setIsVisualRolling, setForcedRoll } from '../../../../state/slices/diceSlice';
import { handlePostDiceRollThunk } from '../../../../state/thunks/handlePostDiceRollThunk';
import GameFinishedScreen from '../GameFinishedScreen/GameFinishedScreen';
import { changeTurnThunk } from '../../../../state/thunks/changeTurnThunk';
import { useMoveAndCaptureToken } from '../../../../hooks/useMoveAndCaptureToken';
import type { TPlayerInitData, TCoordinate } from '../../../../types';
import { useNavigate } from 'react-router-dom';
import { quitMatchThunk } from '../../../../state/thunks/quitMatchThunk';
import { playerCountToWord } from '../../../../game/players/logic';
import { usePageLeaveBlocker } from '../../../../hooks/usePageLeaveBlocker';
import { addToGameInactiveTime, setGameStartTime, setMatchDuration } from '../../../../state/slices/sessionSlice';
import { useGameTimer } from '../../../../hooks/useGameTimer';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import styles from './Game.module.css';
import menuIcon from '../../../../assets/menu.svg';
import { getNakamaSocket, ensureSocketConnected } from '../../../../services/nakama';
import { toast } from 'react-toastify';
import { unlockAndAlignTokens } from '../../../../state/thunks/unlockAndAlignTokens';
import { setTokenTransitionTime } from '../../../../utils/setTokenTransitionTime';
import { FORWARD_TOKEN_TRANSITION_TIME } from '../../../../game/tokens/constants';
import { isTokenMovable } from '../../../../game/tokens/logic';
import { areCoordsEqual } from '../../../../game/coords/logic';
import type { MatchData } from '@heroiclabs/nakama-js';
import { cancelActiveTokenAnimation } from '../../../../hooks/useMoveTokenForward';


export const EXIT_MESSAGE = 'Are you sure you want to exit? Any progress made will be lost.';

export const OnlineGameContext = createContext<{
  isOnline: boolean;
  roomId: string;
  myPlayerColour: TPlayerColour;
  amHost: boolean;
  optimisticTokenMovesRef?: React.MutableRefObject<Set<string>>;
  onTokenMove?: (colour: TPlayerColour, id: number, isUnlock: boolean) => void;
  diceRollStartTimestampRef?: React.MutableRefObject<number>;
  turnDeadlineMs?: number;
  activeTokenAnimationPromiseRef?: React.MutableRefObject<Promise<any> | null>;
} | null>(null);

type Props = {
  initData?: TPlayerInitData[];
  isOnline?: boolean;
  matchedToken?: string;
  matchId?: string;
  matchedUsers?: Array<{
    presence: { user_id: string; session_id: string; username: string };
    string_properties?: { avatarurl?: string; avatarUrl?: string; avatar_url?: string; level?: string; name?: string; userName?: string };
  }>;
  myPlayerId?: string;
  myUserId?: string;
  canonicalColour?: TPlayerColour;
};



function Game({
  initData = [],
  isOnline,
  matchedToken,
  matchId,
  matchedUsers,
  myPlayerId,
  myUserId,
  canonicalColour
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const boardTileSize = useSelector((state: RootState) => state.board.boardTileSize);
  const { playerSequence, isGameEnded, currentPlayerColour, players } =
    useSelector((state: RootState) => state.players);
  const playersRegisteredInitiallyRef = useRef(true);
  const gameInactiveStartTime = useRef(0);
  const navigate = useNavigate();
  const moveAndCapture = useMoveAndCaptureToken();
  useGameTimer();

  const [roomId, setRoomId] = useState<string>('');
  const [myPlayerColour, setMyPlayerColour] = useState<TPlayerColour>(canonicalColour || 'blue');
  const [isMatchJoined, setIsMatchJoined] = useState(!isOnline);
  const [bypassLeaveBlocker, setBypassLeaveBlocker] = useState(false);
  usePageLeaveBlocker(isMatchJoined && !isGameEnded && !bypassLeaveBlocker && import.meta.env.PROD);
  const [localSessionId, setLocalSessionId] = useState<string>('');
  const [turnDeadlineMs, setTurnDeadlineMs] = useState<number>(Date.now() + 15000);
  const matchJoinedRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFinishedScreen, setShowFinishedScreen] = useState(false);

  useEffect(() => {
    if (isGameEnded) {
      const timer = setTimeout(() => setShowFinishedScreen(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowFinishedScreen(false);
    }
  }, [isGameEnded]);

  const [music, setMusic] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('musicEnabled') !== 'false';
  });
  const [vibration, setVibration] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('vibrationEnabled') !== 'false';
  });

  const toggleMusic = () => {
    const nextVal = !music;
    setMusic(nextVal);
    localStorage.setItem('musicEnabled', String(nextVal));
  };

  const toggleVibration = () => {
    const nextVal = !vibration;
    setVibration(nextVal);
    localStorage.setItem('vibrationEnabled', String(nextVal));
    if (nextVal && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // No colorMap needed — all colors transmitted as canonical strings

  useEffect(() => {
    if (initData.length === 0) return;
    
    // Set match duration based on player count: 5 mins for 2P, 10 mins for 4P
    const matchDurationMs = initData.length === 2 ? 300000 : 600000;
    dispatch(setMatchDuration(matchDurationMs));

    if (!isOnline) {
      dispatch(setPlayerSequence({ playerCount: playerCountToWord(initData.length) }));
      dispatch(setGameStartTime(Date.now()));
    }
  }, [dispatch, initData.length, isOnline]);

  useEffect(() => {
    if (initData.length === 0) return;
    if (isOnline) return; // For online, handled after OpCode 1
    for (let i = 0; i < initData.length; i++) {
      if (!playerSequence.length || !playersRegisteredInitiallyRef.current) return;
      const rawColour = initData[i].colour || playerSequence[i];
      const colour = rawColour;
      dispatch(
        registerNewPlayer({
          name: initData[i].name,
          colour,
          isBot: initData[i].isBot,
          avatarUrl: initData[i].avatarUrl,
        })
      );
      dispatch(registerDice(colour));
    }
    playersRegisteredInitiallyRef.current = false;
  }, [dispatch, playerSequence, initData, isOnline]);

  useEffect(() => {
    const handlePageVisibilityChange = () => {
      if (isGameEnded) return;
      if (document.visibilityState === 'hidden') {
        gameInactiveStartTime.current = Date.now();
      } else if (document.visibilityState === 'visible' && gameInactiveStartTime.current > 0) {
        const now = Date.now();
        dispatch(addToGameInactiveTime(now - gameInactiveStartTime.current));
        gameInactiveStartTime.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handlePageVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handlePageVisibilityChange);
  }, [dispatch, isGameEnded]);

  // Turn controller for Local Pass & Play
  useEffect(() => {
    if (isOnline) return;
    if (currentPlayerColour || players.length === 0 || initData.length === 0) return;
    dispatch(changeTurnThunk(moveAndCapture));
  }, [currentPlayerColour, dispatch, initData.length, moveAndCapture, players.length, isOnline]);

  // Stable ref to always have the latest roomId without re-running the effect
  const roomIdRef = useRef<string>('');
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Stable ref to always have the latest myPlayerColour without re-running the effect
  const myPlayerColourRef = useRef<TPlayerColour>(canonicalColour || 'blue');
  useEffect(() => { myPlayerColourRef.current = myPlayerColour; }, [myPlayerColour]);

  // Match start timeout handler to prevent hanging on "Joining Match Session..."
  useEffect(() => {
    if (!isOnline || isMatchJoined) return;

    const timeoutId = setTimeout(() => {
      if (!isMatchJoined) {
        console.error('[ONLINE] Match start timeout. No STATE_SYNC received from server.');
        toast.error('Match start timeout: Could not sync with game loop.');
        navigate('/setup');
      }
    }, 12000); // 12 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isOnline, isMatchJoined, navigate]);

  const optimisticTokenMovesRef = useRef<Set<string>>(new Set());
  const activeTokenAnimationPromiseRef = useRef<Promise<any> | null>(null);
  const diceRollStartTimestampRef = useRef<number>(0);
  const messageQueueRef = useRef<any[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  const onTokenMove = useCallback((_colour: TPlayerColour, id: number, _isUnlock: boolean) => {
    try {
      const socket = getNakamaSocket();
      const currentRoomId = roomIdRef.current;
      console.log('[CLIENT] Sending token move input to server:', _colour, id);
      socket.sendMatchState(currentRoomId, 101, JSON.stringify({ id }));
    } catch (err) {
      console.error('[CLIENT] Failed to send token move input:', err);
      toast.error("Failed to sync token move with server.");
    }
  }, []);

  // Handle Online Match turn coordination
  // ARCHITECTURE: Host-Authoritative Relay
  //   - All game logic (dice, moves, turn changes) executes ONLY on the HOST.
  //   - The HOST broadcasts the authoritative result to ALL clients via OpCodes.
  //   - ALL clients (including host) apply broadcast state identically — zero local pre-processing.
  //   - Players send REQUEST OpCodes (3=roll, 5=move) to the host.
  //   - Host responds with STATE OpCodes (8=dice result, 9=token move result, 6=turn change)
  useEffect(() => {
    if (!isOnline || (!matchedToken && !matchId)) return;

    let socket: ReturnType<typeof getNakamaSocket>;
    try {
      socket = getNakamaSocket();
    } catch(e) {
      navigate('/setup');
      return;
    }

    const originalOnDisconnect = socket.ondisconnect;
    const originalOnError = socket.onerror;

    socket.ondisconnect = (evt) => {
      console.warn('[ONLINE] Nakama socket disconnected:', evt);
      toast.error('Game server connection lost.');
      setBypassLeaveBlocker(true);
      setTimeout(() => navigate('/setup'), 0);
      if (originalOnDisconnect) originalOnDisconnect(evt);
    };

    socket.onerror = (err) => {
      console.error('[ONLINE] Nakama socket error:', err);
      toast.error('Game server connection error.');
      setBypassLeaveBlocker(true);
      setTimeout(() => navigate('/setup'), 0);
      if (originalOnError) originalOnError(err);
    };

    const getEffectivePlayerId = () => localSessionId || myPlayerId || '';
    const originalSendMatchState = socket.sendMatchState.bind(socket);

    // ─── Game Initialization ───────────────────────────────────────────────────
    const initializeGame = (playersList: any[]) => {
      if (!playersRegisteredInitiallyRef.current) return;
      console.log('[ONLINE] Initializing game locally with player list:', playersList);

      const storedUser = localStorage.getItem('ludo_user');
      let localUserName = '';
      let localUserId = '';
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localUserName = parsed.userName;
          localUserId = parsed.userId;
        } catch (e) {}
      }

      const mappedSequence = playersList.map((p: any) => p.colour || p.color);
      const effectivePlayerId = getEffectivePlayerId();
      
      const myMatchPlayer = playersList.find((p: any) => {
        if (p.id && effectivePlayerId && p.id === effectivePlayerId) return true;
        if (p.userId && (p.userId === myUserId || p.userId === localUserId || p.userId === `usr_${localUserId}`)) return true;
        if (p.name && p.name === localUserName) return true;
        return false;
      });

      if (myMatchPlayer) {
        const col = myMatchPlayer.colour || myMatchPlayer.color;
        console.log('[ONLINE] Found my match player in state sync. Color:', col, myMatchPlayer);
        setMyPlayerColour(col);
        myPlayerColourRef.current = col;
      } else {
        console.warn('[ONLINE] Could not find local player in playersList by sessionId/userId/name!', {
          effectivePlayerId,
          myUserId,
          localUserName,
          localUserId,
          playersList
        });
      }

      dispatch(setPlayerSequenceDirect(mappedSequence));
      dispatch(setGameStartTime(Date.now()));

      const matchDurationMs = playersList.length === 2 ? 300000 : 600000;
      dispatch(setMatchDuration(matchDurationMs));

      for (let i = 0; i < playersList.length; i++) {
        const p = playersList[i];
        const col = p.colour || p.color;
        dispatch(registerNewPlayer({
          name: p.name,
          colour: col,
          isBot: p.isBot,
          avatarUrl: p.avatarUrl,
          level: p.level,
          id: p.id,
          userId: p.userId,
        }));
        dispatch(registerDice(col));
      }
      playersRegisteredInitiallyRef.current = false;
      dispatch(setCurrentPlayerColour(mappedSequence[0]));
      setIsMatchJoined(true);
    };

    // ─── Helper: apply turn transition on every client ─────────────────────────
    const applyTurnTransition = (nextColour: TPlayerColour) => {
      cancelActiveTokenAnimation();
      dispatch(setIsAnyTokenMoving(false));
      dispatch(deactivateTokensOfAllPlayers());
      dispatch(setCurrentPlayerColour(nextColour));

      if (diceRollStartTimestampRef.current) {
        diceRollStartTimestampRef.current = 0;
      }

      // Clear dice rolling/placeholder states for ALL players on turn change.
      // Keep last diceNumber visible (don't reset to -1) so the face stays on
      // the last rolled value and doesn't snap to face-1 between turns.
      const colours: TPlayerColour[] = ['blue', 'red', 'green', 'yellow'];
      colours.forEach((col) => {
        dispatch(setIsPlaceholderShowing({ colour: col, isPlaceholderShowing: false }));
        dispatch(setIsVisualRolling({ colour: col, isVisualRolling: false }));
      });
      // Reset ONLY the next colour's dice to -1 (awaiting roll)
      dispatch(setDiceNumberDirect({ colour: nextColour, diceNumber: -1 }));
    };

    // ─── ALL CLIENTS: Apply dice result (OpCode 201) ─────────────────────────────
    const allClientsApplyDiceResult = (data: { colour: TPlayerColour; roll: number; hasMovableTokens?: boolean }, onComplete?: () => void) => {
      const colour = data.colour;
      const roll = data.roll;

      dispatch(setDiceNumberDirect({ colour, diceNumber: roll }));

      let remainingDelay = 0;
      const wasStartedOptimistically = colour === myPlayerColourRef.current && diceRollStartTimestampRef.current > 0;

      if (wasStartedOptimistically) {
        const elapsed = Date.now() - diceRollStartTimestampRef.current;
        remainingDelay = Math.max(0, 300 - elapsed);
        diceRollStartTimestampRef.current = 0;
      } else {
        dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: true }));
        dispatch(setIsVisualRolling({ colour, isVisualRolling: true }));
        remainingDelay = 300;
      }

      // Prefetch auto-move decision and send to server early to overlap with dice roll animation
      let autoMoveTokenId: number | null = null;
      let isAutoMoveLocked = false;
      if (data.hasMovableTokens && colour === myPlayerColourRef.current) {
        const freshState = store.getState();
        const players = freshState.players.players;
        const player = players.find((p) => p.colour === colour);
        if (player) {
          const areUnlockableTokensPresent =
            roll === 6 && player.tokens.some((t) => areCoordsEqual(t.coordinates, t.initialCoords));
          const allTokens = players.flatMap((p) => p.tokens);
          const movableTokens = player.tokens.filter((t) => isTokenMovable(t, roll, allTokens));
          const areAllTokensInSameCoord =
            movableTokens.length === 0
              ? false
              : movableTokens.every((t) => areCoordsEqual(movableTokens[0].coordinates, t.coordinates));

          if (areAllTokensInSameCoord && !areUnlockableTokensPresent) {
            const targetToken = movableTokens[0];
            autoMoveTokenId = targetToken.id;
            isAutoMoveLocked = targetToken.isLocked;

            // Register optimistically early
            const moveKey = `${colour}_${targetToken.id}`;
            optimisticTokenMovesRef.current.add(moveKey);

            try {
              console.log('[AUTO-MOVE-PREFETCH] Sending auto-move early to parallelize network delay:', colour, targetToken.id);
              const socket = getNakamaSocket();
              socket.sendMatchState(roomIdRef.current, 101, JSON.stringify({ id: targetToken.id }));
            } catch (err) {
              console.error('[CLIENT] Failed to send early auto-move input:', err);
            }
          }
        }
      }

      const applyResult = () => {
        dispatch(setIsPlaceholderShowing({ colour, isPlaceholderShowing: false }));
        dispatch(setIsVisualRolling({ colour, isVisualRolling: false }));
        dispatch(setDiceNumberDirect({ colour, diceNumber: data.roll }));

        if (roll === 6) {
          dispatch(incrementNumberOfConsecutiveSix(colour));
          // Reset consecutive sixes if it reaches 3 to match server logic
          const freshState = store.getState();
          const playerObj = freshState.players.players.find(p => p.colour === colour);
          if (playerObj && playerObj.numberOfConsecutiveSix >= 3) {
            dispatch(resetNumberOfConsecutiveSix(colour));
          }
        } else {
          dispatch(resetNumberOfConsecutiveSix(colour));
        }

        // Auto-move visual execution
        if (autoMoveTokenId !== null) {
          const freshState = store.getState();
          const player = freshState.players.players.find((p) => p.colour === colour);
          const targetToken = player?.tokens.find((t) => t.id === autoMoveTokenId);
          if (targetToken) {
            console.log('[AUTO-MOVE-EXECUTE] Playing visual animation for prefetched auto-move:', colour, targetToken.id);
            dispatch(deactivateAllTokens(colour));
            if (isAutoMoveLocked) {
              dispatch(setIsAnyTokenMoving(true));
              setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, targetToken);
              dispatch(unlockAndAlignTokens({ colour, id: targetToken.id }));
              const animPromise = new Promise<void>((resolve) => {
                setTimeout(() => {
                  dispatch(setIsAnyTokenMoving(false));
                  resolve();
                }, FORWARD_TOKEN_TRANSITION_TIME);
              });
              activeTokenAnimationPromiseRef.current = animPromise;
            } else {
              const animPromise = moveAndCapture(targetToken, roll);
              activeTokenAnimationPromiseRef.current = animPromise;
            }
          }
          onComplete?.();
          return;
        }

        // Activate tokens locally ONLY for the active local player so they can click.
        if (data.hasMovableTokens && colour === myPlayerColourRef.current) {
          dispatch(activateTokens({ all: roll === 6, colour, diceNumber: roll }));
        }
        
        onComplete?.();
      };

      if (remainingDelay <= 0) {
        applyResult();
      } else {
        setTimeout(applyResult, remainingDelay);
      }
    };

    // ─── ALL CLIENTS: Apply token move result (OpCode 202) ──────────────────────
    const allClientsApplyTokenMove = async (data: {
      colour: TPlayerColour;
      id: number;
      isUnlock: boolean;
      path: TCoordinate[];
      hasTokenReachedHome: boolean;
      isCaptured: boolean;
      hasPlayerWon: boolean;
      capturedTokenColour?: string;
      capturedTokenId?: number;
    }) => {
      const colour = data.colour;
      const state = store.getState();
      const player = state.players.players.find(p => p.colour === colour);
      if (!player) return;
      const token = player.tokens.find(t => t.id === data.id);
      if (!token) return;

      console.log('[ALL] Applying token move result:', colour, data.id);

      const moveKey = `${colour}_${data.id}`;
      const isOptimistic = optimisticTokenMovesRef.current.has(moveKey);

      if (isOptimistic) {
        optimisticTokenMovesRef.current.delete(moveKey);
        console.log('[OPTIMISTIC] Skipping visual animation of own token move — already animated.');
        if (activeTokenAnimationPromiseRef.current) {
          console.log('[OPTIMISTIC] Awaiting active optimistic animation before resolving...');
          await activeTokenAnimationPromiseRef.current;
          activeTokenAnimationPromiseRef.current = null;
        }
      } else {
        if (data.isUnlock) {
          dispatch(setIsAnyTokenMoving(true));
          setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, token);
          dispatch(unlockAndAlignTokens({ colour, id: data.id }));
          dispatch(deactivateAllTokens(colour));
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              dispatch(setIsAnyTokenMoving(false));
              resolve();
            }, FORWARD_TOKEN_TRANSITION_TIME);
          });
        } else {
          const stepCount = data.path.length;
          await moveAndCapture(token, stepCount);
        }
      }

      // Authoritative reconciliation for captures
      if (data.isCaptured && data.capturedTokenColour && typeof data.capturedTokenId === 'number') {
        try {
          dispatch(lockToken({ colour: data.capturedTokenColour as TPlayerColour, id: data.capturedTokenId }));
        } catch (e) {}
      }

      // Authoritative reconciliation for reaching home
      if (data.hasTokenReachedHome) {
        try {
          dispatch(markTokenAsReachedHome({ colour, id: data.id }));
        } catch (e) {}
      }
    };

    let requestInterval: any;
    let stateSyncRetryInterval: any;

    const handleSingleSocketMessage = async (opCode: number, parsed: any, _result: MatchData) => {
      console.log(`[SOCKET QUEUE] Processing OpCode ${opCode}`, parsed);

      // Use store.getState() to read isGameEnded to avoid stale closure
      const currentIsGameEnded = store.getState().players.isGameEnded;

      // Handle rematch events after game has ended, ignore all other match events
      if (currentIsGameEnded) {
        if (opCode >= 101 && opCode <= 103) {
          document.dispatchEvent(new CustomEvent('nakama-rematch-event', { detail: { opCode, parsed } }));
        }
        return;
      }

      if (opCode === 200) {
        // STATE_SYNC
        if (playersRegisteredInitiallyRef.current) {
          initializeGame(parsed.players);
        } else {
          const isMoving = store.getState().players.isAnyTokenMoving;
          const isStableState = !isMoving && (!parsed.hasRolled || parsed.status === 'ended');
          parsed.players.forEach((p: any) => {
            if (p.isBot) {
              dispatch(convertPlayerToBot({ colour: p.colour }));
            }
            if (p.hasQuit) {
              const localPlayer = store.getState().players.players.find(lp => lp.colour === p.colour);
              if (localPlayer && !localPlayer.hasQuit) {
                dispatch(quitMatch(p.colour));
              }
            }
            // Sync missedTurns authoritatively from the server so lifeline dots
            // reflect real missed turns. Without this, dots never decrease online.
            if (typeof p.missedTurns === 'number') {
              const localPlayer = store.getState().players.players.find(lp => lp.colour === p.colour);
              if (localPlayer && localPlayer.missedTurns !== p.missedTurns) {
                dispatch(setPlayerMissedTurns({ colour: p.colour, missedTurns: p.missedTurns }));
              }
            }
            // Skip snapping token details if a local or remote token animation is active
            // or if the player has already rolled and is about to move.
            // This prevents snapping and incorrect predictions during live gameplay.
            if (isStableState) {
              p.tokens.forEach((t: any) => {
                if (t.hasTokenReachedHome) {
                  try { dispatch(markTokenAsReachedHome({ colour: p.colour, id: t.id })); } catch(e) {}
                  dispatch(changeCoordsOfToken({ colour: p.colour, id: t.id, newCoords: t.coordinates }));
                } else {
                  dispatch(changeCoordsOfToken({ colour: p.colour, id: t.id, newCoords: t.coordinates }));
                  if (t.isLocked) {
                    try { dispatch(lockToken({ colour: p.colour, id: t.id })); } catch(e) {}
                  } else {
                    try { dispatch(unlockToken({ colour: p.colour, id: t.id })); } catch(e) {}
                  }
                }
              });
            }
          });
          dispatch(setPlayerSequenceDirect(parsed.playerSequence));
          dispatch(setCurrentPlayerColour(parsed.currentTurnColour));
        }

        if (typeof parsed.turnRemainingMs === 'number') {
          setTurnDeadlineMs(Date.now() + parsed.turnRemainingMs);
        } else {
          setTurnDeadlineMs(parsed.turnDeadlineMs);
        }

        // Authoritatively sync dice numbers:
        // Only sync if not currently rolling/animating to avoid clobbering animation state.
        // IMPORTANT: Do NOT reset dice to -1 on STATE_SYNC — only TURN_CHANGE (203) resets dice.
        // Resetting to -1 here makes the cube visually snap to face-1 between turns.
        const colours: TPlayerColour[] = ['blue', 'red', 'green', 'yellow'];
        const freshDiceState = store.getState().dice;
        const isCurrentlyRolling = freshDiceState.dice.some(d => d.isVisualRolling || d.isPlaceholderShowing);
        if (!isCurrentlyRolling) {
          colours.forEach((col) => {
            if (col === parsed.currentTurnColour) {
              // Only update if the server dice number is valid (>=1) OR if we haven't rolled yet
              if (parsed.diceNumber >= 1 || !parsed.hasRolled) {
                dispatch(setDiceNumberDirect({ colour: col, diceNumber: parsed.diceNumber }));
              }
            }
            // Don't touch other colours' dice numbers to preserve their last-shown value
          });
        }

        // Ensure dice animations are cleared on state sync if the roll has already occurred/resolved
        colours.forEach((col) => {
          // Only clear animation state for non-active players, or if match hasn't rolled yet
          if (col !== parsed.currentTurnColour || parsed.hasRolled) {
            dispatch(setIsPlaceholderShowing({ colour: col, isPlaceholderShowing: false }));
            dispatch(setIsVisualRolling({ colour: col, isVisualRolling: false }));
          }
        });

      } else if (opCode === 201) {
        // DICE_ROLLED
        await new Promise<void>((resolve) => {
          allClientsApplyDiceResult(parsed, resolve);
        });

      } else if (opCode === 202) {
        // TOKEN_MOVED
        await allClientsApplyTokenMove(parsed);

      } else if (opCode === 203) {
        // TURN_CHANGE
        if (typeof parsed.turnRemainingMs === 'number') {
          setTurnDeadlineMs(Date.now() + parsed.turnRemainingMs);
        } else {
          setTurnDeadlineMs(parsed.deadlineMs);
        }
        applyTurnTransition(parsed.nextTurnColour);

      } else if (opCode === 204) {
        // MATCH_END
        toast.success(`Match ended! Winner: ${parsed.winnerColour}`);
        dispatch(declareForfeit({ losingColour: parsed.winnerColour === 'blue' ? 'green' : 'blue' }));

      } else if (opCode === 205) {
        // ACTION_REJECTED
        console.warn("[CLIENT] Action rejected by server:", parsed.reason);
        // 'Not your turn' and 'Already rolled' are expected race conditions in the
        // authoritative server model (e.g. bot took over just before player tapped).
        // Showing a toast for these would be confusing noise — only surface truly
        // unexpected rejections (e.g. 'Invalid move') as user-facing errors.
        if (parsed.reason !== 'Not your turn' && parsed.reason !== 'Already rolled') {
          toast.error(`Invalid action: ${parsed.reason}`);
        }
        // Always clear local rolling/placeholder state so the dice stops animating.
        dispatch(setIsPlaceholderShowing({ colour: myPlayerColourRef.current, isPlaceholderShowing: false }));
        dispatch(setIsVisualRolling({ colour: myPlayerColourRef.current, isVisualRolling: false }));
      }
    };

    const processMessageQueue = async () => {
      if (isProcessingQueueRef.current || messageQueueRef.current.length === 0) return;
      isProcessingQueueRef.current = true;

      while (messageQueueRef.current.length > 0) {
        const nextMsg = messageQueueRef.current.shift();
        if (!nextMsg) continue;
        try {
          await handleSingleSocketMessage(nextMsg.opCode, nextMsg.parsed, nextMsg.result);
        } catch (err) {
          console.error('[QUEUE] Error processing socket message:', err);
        }
      }

      isProcessingQueueRef.current = false;
    };

    socket.onmatchdata = (result: MatchData) => {
      const data = new TextDecoder().decode(result.data);
      let parsed: any;
      try { parsed = JSON.parse(data); } catch(e) { return; }

      const opCode = result.op_code;
      console.log(`[SOCKET] Enqueueing OpCode ${opCode}`, parsed);

      messageQueueRef.current.push({ opCode, parsed, result });
      processMessageQueue();
    };

    const joinMatchAsync = async () => {
      if (matchJoinedRef.current) return;
      matchJoinedRef.current = true;
      try {
        const liveSocket = await ensureSocketConnected();
        console.log('[ONLINE] Joining match. matchId:', matchId, 'token:', matchedToken ? 'present' : 'missing');
        let match;

        if (matchId) {
          try {
            match = await liveSocket.joinMatch(matchId);
          } catch (err: any) {
            console.warn('[ONLINE] Failed to join via matchId, falling back to token...', err);
            if (matchedToken) match = await liveSocket.joinMatch(undefined, matchedToken);
            else throw err;
          }
        } else if (matchedToken) {
          match = await liveSocket.joinMatch(undefined, matchedToken);
        } else {
          throw new Error('No match ID or matchmaking token provided.');
        }

        const joinedMatchId = match.match_id;
        console.log('[ONLINE] Joined match successfully. match_id:', joinedMatchId);
        setRoomId(joinedMatchId);

        const mySessionId = match.self?.session_id || '';
        if (mySessionId) setLocalSessionId(mySessionId);

        // Explicitly request STATE_SYNC from server (OpCode 199).
        // This is the authoritative trigger: even if matchJoin's push was lost in transit,
        // the server will respond to our request with a fresh STATE_SYNC.
        const sendStateSyncRequest = () => {
          try {
            console.log('[ONLINE] Sending REQUEST_STATE_SYNC (OpCode 199)...');
            getNakamaSocket().sendMatchState(joinedMatchId, 199, '{}');
          } catch (e) {
            console.warn('[ONLINE] Failed to send state sync request:', e);
          }
        };

        // Send immediately, then retry every 2s until STATE_SYNC received
        sendStateSyncRequest();
        stateSyncRetryInterval = setInterval(() => {
          if (matchJoinedRef.current && !playersRegisteredInitiallyRef.current) {
            // STATE_SYNC received → stop retrying
            clearInterval(stateSyncRetryInterval);
            return;
          }
          console.log('[ONLINE] Retrying REQUEST_STATE_SYNC (OpCode 199)...');
          sendStateSyncRequest();
        }, 2000);

        // Periodically ping host to maintain connection
        requestInterval = setInterval(() => {
          try {
            getNakamaSocket().sendMatchState(joinedMatchId, 102, '{}');
          } catch (e) {}
        }, 4000);
      } catch (e: any) {
        matchJoinedRef.current = false;
        if (requestInterval) clearInterval(requestInterval);
        if (stateSyncRetryInterval) clearInterval(stateSyncRetryInterval);
        console.error('[ONLINE] Error joining match:', e);
        toast.error('Error joining match: ' + e.message);
        navigate('/setup');
      }
    };

    joinMatchAsync();

    return () => {
      socket.onmatchdata = () => {};
      socket.ondisconnect = originalOnDisconnect;
      socket.onerror = originalOnError;
      socket.sendMatchState = originalSendMatchState; // Restore original sendMatchState
      if (requestInterval) clearInterval(requestInterval);
      if (stateSyncRetryInterval) clearInterval(stateSyncRetryInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, matchedToken, matchId, myPlayerId, myUserId]);

  const handleDiceRoll = (colour: TPlayerColour, diceNumber: number) => {
    if (!isOnline) {
      if (initData.length === 0) return;
      dispatch(handlePostDiceRollThunk(colour, diceNumber, moveAndCapture));
    }
  };

  const handleExitBtnClick = () => {
    setIsMenuOpen(false);

    const colourToQuit = isOnline ? (myPlayerColour || currentPlayerColour) : currentPlayerColour;

    if (isOnline && roomId) {
      try {
        getNakamaSocket().sendMatchState(roomId, 7, JSON.stringify({ colour: colourToQuit }));
      } catch (e) {}
    }

    if (colourToQuit) {
      dispatch(quitMatchThunk(colourToQuit, moveAndCapture));
    }

    // 4-Player mode: The quitting player navigates to Home immediately and skips the leaderboard
    // 2-Player mode: The match ends and the Leaderboard appears instantly
    if (players.length > 2) {
      setBypassLeaveBlocker(true);
      setTimeout(() => navigate('/setup'), 0);
    }
  };

  // Global keypad event listener to preset forcedRoll for testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isGameEnded) return;

      // Ignore keydown if user is typing in input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      let num = NaN;
      if (e.code && e.code.startsWith('Digit')) {
        num = parseInt(e.code.substring(5), 10);
      } else if (e.code && e.code.startsWith('Numpad') && e.code.length === 7) {
        num = parseInt(e.code.substring(6), 10);
      } else {
        const parsed = parseInt(e.key, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
          num = parsed;
        }
      }

      if (!isNaN(num) && num >= 1 && num <= 6) {
        dispatch(setForcedRoll(num));
        toast.info(`Next roll preset to: ${num}`, { toastId: 'forced-roll-toast', autoClose: 1500 });

        // Trigger immediate roll if it is the active player's turn
        const activeColour = isOnline ? myPlayerColour : currentPlayerColour;
        if (activeColour) {
          setTimeout(() => {
            const btn = document.getElementById(`dice-btn-${activeColour}`) as HTMLButtonElement | null;
            if (btn && !btn.disabled) {
              btn.click();
            }
          }, 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isGameEnded, isOnline, myPlayerColour, currentPlayerColour]);

  // Determine if the local player is the host (lowest session_id alphabetically)
  const amHostValue = useMemo(() => {
    if (!matchedUsers || matchedUsers.length === 0) return false;
    const allSessionIds = matchedUsers.map(u => u.presence.session_id).sort();
    return allSessionIds[0] === (localSessionId || myPlayerId || '');
  }, [matchedUsers, localSessionId, myPlayerId]);

  const onlineContextValue = useMemo(() => {
    if (!isOnline) return null;
    return {
      isOnline: true,
      roomId,
      myPlayerColour,
      amHost: amHostValue,
      optimisticTokenMovesRef,
      onTokenMove,
      diceRollStartTimestampRef,
      turnDeadlineMs,
      activeTokenAnimationPromiseRef,
    };
  }, [isOnline, roomId, myPlayerColour, amHostValue, onTokenMove, turnDeadlineMs]);

  if (isOnline && !isMatchJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0222', color: '#ffca28', fontFamily: 'Jua, sans-serif' }}>
        <h2>Joining Match Session...</h2>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,202,40,0.2)', borderTop: '3px solid #ffca28', borderRadius: '50%', animation: 'spin 1s linear infinite', marginTop: '20px' }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <OnlineGameContext.Provider value={onlineContextValue}>
      <div
        className={styles.game}
        style={
          {
            '--board-tile-size': `${boardTileSize}px`,
          } as React.CSSProperties
        }
      >
        <div className={styles.boardWrapper}>
          <ScoreBoard />
          <Board onDiceClick={handleDiceRoll} />
          <button
            type="button"
            aria-label="Menu button"
            className={styles.menuBtn}
            onClick={() => setIsMenuOpen(true)}
          >
            <img src={menuIcon} alt="Menu" className={styles.menuIconImg} />
          </button>
        </div>
        {isMenuOpen && (
          <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
            <div className={styles.menuModal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.menuTitle}>Game Menu</h2>
              
              <div className={styles.menuSettings}>
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>Music & Sound</span>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={music} onChange={toggleMusic} />
                    <span className={styles.slider} />
                  </label>
                </div>
                
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>Vibration</span>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={vibration} onChange={toggleVibration} />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.menuActions}>
                <button
                  type="button"
                  className={styles.resumeBtn}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resume Game
                </button>
                <button
                  type="button"
                  className={styles.quitBtn}
                  onClick={handleExitBtnClick}
                >
                  Quit Game
                </button>
              </div>
            </div>
          </div>
        )}
        {showFinishedScreen && <GameFinishedScreen players={players} />}
      </div>
    </OnlineGameContext.Provider>
  );
}

export default Game;
