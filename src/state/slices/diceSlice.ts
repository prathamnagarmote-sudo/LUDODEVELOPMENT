import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TPlayerColour } from '../../types';
import type { TDice } from '../../types';

export type TDiceState = {
  dice: TDice[];
  rollBag: Record<TPlayerColour, number[]>;
  forcedRoll: number | null;
};

export const initialState: TDiceState = {
  dice: [],
  rollBag: { blue: [], red: [], green: [], yellow: [] },
  forcedRoll: null,
};

export function getDice(state: TDiceState, colour: TPlayerColour): TDice | undefined {
  return state.dice.find((d) => d.colour === colour);
}

export function generateRollBag(): number[] {
  const diceNumbers = Array(36)
    .fill(null)
    .map((_, i) => (i % 6) + 1);
  return diceNumbers;
}

const reducers = {
  registerDice: (state: TDiceState, action: PayloadAction<TPlayerColour>) => {
    state.dice.push({
      colour: action.payload,
      diceNumber: -1,
      isPlaceholderShowing: false,
      isVisualRolling: false,
    });
    state.rollBag[action.payload] = generateRollBag();
  },
  setIsPlaceholderShowing: (
    state: TDiceState,
    action: PayloadAction<{ colour: TPlayerColour; isPlaceholderShowing: boolean }>
  ) => {
    const dice = getDice(state, action.payload.colour);
    if (dice) {
      dice.isPlaceholderShowing = action.payload.isPlaceholderShowing;
    }
  },
  setIsVisualRolling: (
    state: TDiceState,
    action: PayloadAction<{ colour: TPlayerColour; isVisualRolling: boolean }>
  ) => {
    const dice = getDice(state, action.payload.colour);
    if (dice) {
      dice.isVisualRolling = action.payload.isVisualRolling;
    }
  },
  setDiceNumber: (
    state: TDiceState,
    action: PayloadAction<{ colour: TPlayerColour; randomIndex: number }>
  ) => {
    const dice = getDice(state, action.payload.colour);
    if (dice) {
      dice.diceNumber = state.rollBag[action.payload.colour][action.payload.randomIndex];
      state.rollBag[action.payload.colour] = state.rollBag[action.payload.colour].filter(
        (_, i) => i !== action.payload.randomIndex
      );
    }
  },
  renewRollBag: (state: TDiceState, action: PayloadAction<TPlayerColour>) => {
    state.rollBag[action.payload] = generateRollBag();
  },
  setDiceNumberDirect: (
    state: TDiceState,
    action: PayloadAction<{ colour: TPlayerColour; diceNumber: number }>
  ) => {
    const dice = getDice(state, action.payload.colour);
    if (dice) {
      dice.diceNumber = action.payload.diceNumber;
    }
  },
  setForcedRoll: (state: TDiceState, action: PayloadAction<number | null>) => {
    state.forcedRoll = action.payload;
  },
  clearDiceState: () => initialState,
};

const diceSlice = createSlice({
  name: 'dice',
  initialState,
  reducers,
});

export const {
  registerDice,
  setDiceNumber,
  setIsPlaceholderShowing,
  setIsVisualRolling,
  renewRollBag,
  setDiceNumberDirect,
  setForcedRoll,
  clearDiceState,
} = diceSlice.actions;

export default diceSlice.reducer;
