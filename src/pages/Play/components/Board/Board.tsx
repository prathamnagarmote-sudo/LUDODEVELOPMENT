import boardSvg from '../../../../assets/board.svg';
import Token from '../Token/Token';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import { useCallback, useState, useContext } from 'react';
import { NUMBER_OF_BLOCKS_IN_ONE_ROW, resizeBoard } from '../../../../state/slices/boardSlice';
import { ERRORS } from '../../../../utils/errors';
import Dice from '../Dice/Dice';
import type { TCoordinate, TPlayerColour } from '../../../../types';
import { getTokenDOMId, tokensWithCoord } from '../../../../game/tokens/logic';
import type { TTokenClickData } from '../../../../types/tokens';
import styles from './Board.module.css';
import { useResizeObserver } from '../../../../hooks/useResizeObserver';
import { OnlineGameContext } from '../Game/Game';

type Props = {
  onDiceClick: (colour: TPlayerColour, diceNumber: number) => void;
};

function Board({ onDiceClick: onDiceRoll }: Props) {
  const { players, currentPlayerColour } = useSelector((state: RootState) => state.players);
  const { boardTileSize, boardSideLength } = useSelector((state: RootState) => state.board);
  const { dice } = useSelector((state: RootState) => state.dice);
  const [tokenClickData, setTokenClickData] = useState<TTokenClickData | null>(null);
  const [boardNode, setBoardNode] = useState<HTMLDivElement | null>(null);
  const dispatch = useDispatch();

  const onlineContext = useContext(OnlineGameContext);
  const isOnline = !!onlineContext?.isOnline;
  const myPlayerColour = onlineContext?.myPlayerColour || 'blue';

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
    const tileStartCoords = Array(NUMBER_OF_BLOCKS_IN_ONE_ROW)
      .fill(null)
      .map((_, i) => (i + 1) * boardTileSize);

    if (boardX > boardSideLength || boardY > boardSideLength || boardX < 0 || boardY < 0) return;

    const coordX = tileStartCoords.findIndex((v) => boardX < v);
    const coordY = tileStartCoords.findIndex((v) => boardY < v);

    const coords: TCoordinate = { x: coordX, y: coordY };

    const tokenToMove = tokensWithCoord(coords, players).filter(
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
      <img src={boardSvg} className={styles.boardImage} aria-hidden="true" />
      <div className={`${styles.paddockGlow} ${styles.red} ${currentPlayerColour === 'red' ? styles.active : ''} ${isOnline && myPlayerColour === 'red' ? styles.local : ''}`} />
      <div className={`${styles.paddockGlow} ${styles.green} ${currentPlayerColour === 'green' ? styles.active : ''} ${isOnline && myPlayerColour === 'green' ? styles.local : ''}`} />
      <div className={`${styles.paddockGlow} ${styles.yellow} ${currentPlayerColour === 'yellow' ? styles.active : ''} ${isOnline && myPlayerColour === 'yellow' ? styles.local : ''}`} />
      <div className={`${styles.paddockGlow} ${styles.blue} ${currentPlayerColour === 'blue' ? styles.active : ''} ${isOnline && myPlayerColour === 'blue' ? styles.local : ''}`} />
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

