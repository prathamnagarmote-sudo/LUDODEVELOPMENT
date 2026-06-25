import boardSvg from '../../../../assets/board.svg';
import winCrownImg from '../../../../Atlas_Lobby/images/win crown.png';
import Token from '../Token/Token';
import clsx from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { useCallback, useState, useContext } from 'react';
import { resizeBoard } from '../../../../state/slices/boardSlice';
import { ERRORS } from '../../../../utils/errors';
import Dice from '../Dice/Dice';
import type { TCoordinate, TPlayerColour } from '../../../../types';
import { getTokenDOMId, tokensWithCoord } from '../../../../game/tokens/logic';
import type { TTokenClickData } from '../../../../types/tokens';
import styles from './Board.module.css';
import { useResizeObserver } from '../../../../hooks/useResizeObserver';
import { OnlineGameContext } from '../Game/Game';

import { getVisualColour, getLogicalCoordinates } from '../../../../utils/colourMapping';

const getSafetyColor = (color: TPlayerColour, opacity = 1.0): string => {
  switch (color) {
    case 'red':
      return `rgba(220, 38, 38, ${opacity})`; // Vibrant safety red
    case 'green':
      return `rgba(35, 127, 82, ${opacity})`; // Official safety green (ISO 7010)
    case 'yellow':
      return `rgba(217, 119, 6, ${opacity})`; // Rich safety amber/yellow
    case 'blue':
      return `rgba(29, 78, 216, ${opacity})`; // Vibrant safety blue
    default:
      return `rgba(35, 127, 82, ${opacity})`;
  }
};

type Props = {
  onDiceClick: (colour: TPlayerColour, diceNumber: number) => void;
};

function Board({ onDiceClick: onDiceRoll }: Props) {
  const { players, currentPlayerColour, playerFinishOrder } = useSelector((state: RootState) => state.players);
  const { boardSideLength, boardTileSize } = useSelector((state: RootState) => state.board);
  const { dice } = useSelector((state: RootState) => state.dice);
  const [tokenClickData, setTokenClickData] = useState<TTokenClickData | null>(null);
  const [boardNode, setBoardNode] = useState<HTMLDivElement | null>(null);
  const dispatch = useDispatch();

  const onlineContext = useContext(OnlineGameContext);
  const isOnline = !!onlineContext?.isOnline;
  const myPlayerColour = onlineContext?.myPlayerColour || 'blue';

  const posClasses: Record<TPlayerColour, string> = {
    red: styles.posRed,
    green: styles.posGreen,
    yellow: styles.posYellow,
    blue: styles.posBlue,
  };
  const glowClasses: Record<TPlayerColour, string> = {
    red: styles.glowRed,
    green: styles.glowGreen,
    yellow: styles.glowYellow,
    blue: styles.glowBlue,
  };

  const onBoardResize = useCallback(() => {
    if (!boardNode) throw new Error(ERRORS.boardDoesNotExist());
    const boardSideLength = boardNode.getBoundingClientRect().width;
    dispatch(resizeBoard(boardSideLength));
  }, [boardNode, dispatch]);

  useResizeObserver(boardNode, onBoardResize);

  const handleBoardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (players.find((p) => p.colour === currentPlayerColour)?.isBot) return;
    if (!boardNode) throw new Error(ERRORS.boardDoesNotExist());
    const { top, left } = boardNode.getBoundingClientRect();
    const boardX = e.clientX - left;
    const boardY = e.clientY - top;

    if (boardX > boardSideLength || boardY > boardSideLength || boardX < 0 || boardY < 0) return;

    const coordX = Math.max(0, Math.min(14, Math.floor(boardX / boardTileSize)));
    const coordY = Math.max(0, Math.min(14, Math.floor(boardY / boardTileSize)));

    const coords: TCoordinate = { x: coordX, y: coordY };
    const logicalCoords = getLogicalCoordinates(coords, isOnline, onlineContext?.myPlayerColour);

    const tokenToMove = tokensWithCoord(logicalCoords, players).filter(
      (t) => t.colour === currentPlayerColour
    )[0];

    if (!tokenToMove || tokenToMove.isLocked) return;

    // For online play, block moves if it's not our turn
    if (isOnline && currentPlayerColour !== myPlayerColour) return;

    setTokenClickData({
      timestamp: Date.now(),
      colour: tokenToMove.colour,
      id: tokenToMove.id,
    });
  };

  return (
    <div className={styles.board} ref={setBoardNode} onClick={handleBoardClick}>
      <svg style={{ width: 0, height: 0, position: 'absolute', pointerEvents: 'none', opacity: 0 }}>
        <defs>
          <linearGradient id="token-grad-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#003b73" />
            <stop offset="100%" stopColor="#00a2e8" />
          </linearGradient>
          <linearGradient id="token-grad-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#800a00" />
            <stop offset="100%" stopColor="#f24b3f" />
          </linearGradient>
          <linearGradient id="token-grad-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#034d19" />
            <stop offset="100%" stopColor="#24d658" />
          </linearGradient>
          <linearGradient id="token-grad-yellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#996000" />
            <stop offset="100%" stopColor="#ffb700" />
          </linearGradient>
        </defs>
      </svg>
      <img src={boardSvg} className={styles.boardImage} aria-hidden="true" />

      {['red', 'green', 'yellow', 'blue'].map((color) => {
        const visualColour = getVisualColour(color as TPlayerColour, isOnline, onlineContext?.myPlayerColour);
        const playerObj = players.find((p) => p.colour === color);
        const hasQuit = playerObj?.hasQuit;

        if (hasQuit) {
          return (
            <div
              key={color}
              className={clsx(
                styles.runAwayOverlay,
                posClasses[visualColour]
              )}
            >
              <div className={styles.runAwayIconWrapper}>
                <svg viewBox="0 0 105.833 105.833" className={styles.runAwaySvg}>
                  {/* Background: player-colored inner area with 77% opacity to let paddock and tokens show through */}
                  <rect x="0" y="0" width="105.833" height="105.833" fill={getSafetyColor(visualColour, 0.77)} />
                  
                  {/* Border: solid white inner outline, inset to leave a safety color margin exactly like the official sign */}
                  <rect x="9.5" y="9.5" width="86.833" height="86.833" fill="none" stroke="#ffffff" strokeWidth="3.0" />
                  
                  {/* Iconography: solid white running man & door graphics with white outlines, scaled down to 72% to fit perfectly inside the border with padding, and horizontally mirrored (reverted) */}
                  <g transform="translate(52.916, 52.916) scale(-0.72, 0.72) translate(-52.916, -52.916)">
                    <path
                      fill="#ffffff"
                      stroke="#ffffff"
                      strokeWidth="3.0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M151.169 77.71V175.934H84.346V125.199H98.01c.084 0 .163.004.246.004.056 0 .083-.007.136-.008q.052 0 .103-.004c1.439-.028 1.75-.282 2.779-1.31l6.241-7.378c1.731 3.785 3.362 7.004 5.085 10.66.195.374.655 1.213.31 1.867l-17.153 34.636 6.292-.021c3.29.072 4.662-2.198 5.819-4.23 4.64-9.353 9.301-18.697 13.949-28.05l.877 16.643c.23 2.88 2.176 3.612 4.726 3.691l28.817.066c0-3.312-3.282-7.687-8.627-7.895 0 0-10.292.116-15.673.137-.682 0-.869-.38-.948-.948-.25-4.282-.488-8.591-.754-12.872-.166-2.126-.352-3.598-.969-5.207-2.01-4.31-4.022-8.6-6.035-12.895l7.364-.085c.193-.007.344.035.444.208l5.33 9.337c2.199 4.01 8.139 1.086 6.149-3.166l-6.537-10.933c-1.15-1.71-1.674-2.299-4.661-2.392 0 0-13.956-.022-20.945-.022-2.27-.05-2.53.661-3.614 1.817a649 649 0 0 1-8.95 10.79H84.346V77.71Zm-38.65 8.337c-4 0-7.067 3.075-7.067 7.097 0 4.03 3.067 7.104 7.068 7.104s7.075-3.075 7.075-7.104c0-4.022-3.075-7.097-7.075-7.097"
                      transform="translate(-65.617 -73.906)"
                    />
                  </g>
                </svg>
              </div>
            </div>
          );
        }

        return (
          <div
            key={color}
            className={clsx(
              styles.paddockGlow,
              posClasses[visualColour],
              glowClasses[visualColour],
              currentPlayerColour === color && styles.active
            )}
          />
        );
      })}

      {players.map((p) =>
        p.tokens.map((t) => (
          <Token
            colour={t.colour}
            id={t.id}
            tokenClickData={tokenClickData}
            key={getTokenDOMId(t.colour, t.id)}
          />
        ))
      )}

      {players.length === 4 && playerFinishOrder &&
        players.map((p) => {
          const rankIndex = playerFinishOrder.findIndex((f) => f.colour === p.colour);
          if (rankIndex === -1) return null;
          const rank = rankIndex + 1;
          if (rank >= 4) return null;
          const visualColour = getVisualColour(p.colour, isOnline, onlineContext?.myPlayerColour);

          return (
            <div key={`rank-${p.colour}`} className={clsx(styles.rankIndicator, styles[visualColour])}>
              <span className={styles.rankNumber}>{rank}</span>
              {rank === 1 && <img src={winCrownImg} className={styles.crownImage} alt="Winner Crown" />}
            </div>
          );
        })}
      {dice.map((d) => (
        <Dice
          colour={d.colour}
          onDiceClick={onDiceRoll}
          playerName={players.find((p) => p.colour === d.colour)?.name as string}
          key={d.colour}
        />
      ))}
    </div>
  );
}

export default Board;

