import { FORWARD_TOKEN_TRANSITION_TIME } from '../../game/tokens/constants';
import { selectBestTokenForBot } from '../../game/bot/selectBestTokenForBot';
import type { AppDispatch, RootState } from '../store';
import type { useMoveAndCaptureToken } from '../../hooks/useMoveAndCaptureToken';
import { setTokenTransitionTime } from '../../utils/setTokenTransitionTime';
import { changeTurn, deactivateAllTokens } from '../slices/playersSlice';
import { handlePostDiceRollThunk } from './handlePostDiceRollThunk';
import { rollDiceThunk } from './rollDiceThunk';
import { unlockAndAlignTokens } from './unlockAndAlignTokens';
import { setDiceNumberDirect } from '../slices/diceSlice';

export function changeTurnThunk(moveAndCapture: ReturnType<typeof useMoveAndCaptureToken>) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().players.isGameEnded) return;

    dispatch(changeTurn());
    const { currentPlayerColour, players } = getState().players;
    if (currentPlayerColour) {
      dispatch(setDiceNumberDirect({ colour: currentPlayerColour, diceNumber: -1 }));
    }

    const { colour, isBot } = players.find((p) => p.colour === currentPlayerColour) ?? {};

    if (!isBot || !colour) return;

    const handleDiceRoll = async (diceNumber: number) => {
      const { shouldContinue, moveData: autoMoveData } =
        (await dispatch(handlePostDiceRollThunk(colour, diceNumber, moveAndCapture))) ?? {};
      dispatch(deactivateAllTokens(colour));

      const { players } = getState().players;

      const allTokens = players.flatMap((p) => p.tokens);
      if (!shouldContinue) return;
      if (autoMoveData) {
        const { hasTokenReachedHome, isCaptured } = autoMoveData;
        if (!isCaptured && !hasTokenReachedHome && diceNumber !== 6) {
          return setTimeout(() => dispatch(changeTurnThunk(moveAndCapture)), 1000);
        } else {
          return setTimeout(() => dispatch(rollDiceThunk(colour, handleDiceRoll)), 500);
        }
      }

      const bestToken = selectBestTokenForBot(colour, diceNumber, allTokens);
      if (!bestToken) return;

      setTokenTransitionTime(FORWARD_TOKEN_TRANSITION_TIME, bestToken);

      if (bestToken.isLocked && !bestToken.hasTokenReachedHome && diceNumber === 6) {
        dispatch(unlockAndAlignTokens({ colour, id: bestToken.id }));
        return setTimeout(() => dispatch(rollDiceThunk(colour, handleDiceRoll)), 500);
      }
      const moveData = await moveAndCapture(bestToken, diceNumber);
      if (!moveData) return dispatch(changeTurnThunk(moveAndCapture));
      const { hasTokenReachedHome, isCaptured, hasPlayerWon } = moveData;
      if (hasPlayerWon) return setTimeout(() => dispatch(changeTurnThunk(moveAndCapture)), 1000);
      if (!isCaptured && !hasTokenReachedHome && diceNumber !== 6) {
        return setTimeout(() => dispatch(changeTurnThunk(moveAndCapture)), 1000);
      } else {
        return setTimeout(() => dispatch(rollDiceThunk(colour, handleDiceRoll)), 500);
      }
    };
    dispatch(rollDiceThunk(colour, handleDiceRoll));
  };
}
