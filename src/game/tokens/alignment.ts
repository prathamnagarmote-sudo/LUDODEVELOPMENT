import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import type { TToken, TTokenAlignmentData, TPlayerColour } from '../../types';
import { setTokenAlignmentData } from '../../state/slices/playersSlice';
import { areCoordsEqual } from '../coords/logic';

// ... (existing alignment data objects)


export const defaultTokenAlignmentData = { xOffset: 0, yOffset: 0, scaleFactor: 1 };

export const tokenAlignmentData: Record<number, TTokenAlignmentData[]> = {
  1: [defaultTokenAlignmentData],
  2: [
    {
      xOffset: -0.25,
      yOffset: 0,
      scaleFactor: 0.8,
    },
    {
      xOffset: 0.25,
      yOffset: 0,
      scaleFactor: 0.8,
    },
  ],
  3: [
    {
      xOffset: -0.32,
      yOffset: 0,
      scaleFactor: 0.6,
    },
    {
      xOffset: 0,
      yOffset: 0,
      scaleFactor: 0.6,
    },
    {
      xOffset: 0.32,
      yOffset: 0,
      scaleFactor: 0.6,
    },
  ],
  4: [
    {
      xOffset: -0.18,
      yOffset: 0.2,
      scaleFactor: 0.55,
    },
    {
      xOffset: 0.18,
      yOffset: 0.2,
      scaleFactor: 0.55,
    },
    {
      xOffset: -0.18,
      yOffset: -0.2,
      scaleFactor: 0.55,
    },
    {
      xOffset: 0.18,
      yOffset: -0.2,
      scaleFactor: 0.55,
    },
  ],
  5: [
    {
      xOffset: 0.28,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: -0.15,
      yOffset: -0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0.15,
      yOffset: -0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: -0.28,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
  ],
  6: [
    {
      xOffset: -0.28,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0.28,
      yOffset: 0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: -0.28,
      yOffset: -0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0,
      yOffset: -0.2,
      scaleFactor: 0.5,
    },
    {
      xOffset: 0.28,
      yOffset: -0.2,
      scaleFactor: 0.5,
    },
  ],
  7: [
    {
      xOffset: -0.35,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.25,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.25,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
  ],
  8: [
    {
      xOffset: -0.35,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: -0.2,
      scaleFactor: 0.4,
    },
  ],
  9: [
    {
      xOffset: -0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
  ],
  10: [
    {
      xOffset: -0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.23,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.23,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
  ],
  11: [
    {
      xOffset: -0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.23,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.23,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
  ],
  12: [
    {
      xOffset: -0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: 0,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.35,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
    {
      xOffset: 0.35,
      yOffset: -0.25,
      scaleFactor: 0.4,
    },
  ],
  13: [
    {
      xOffset: -0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
  ],
  14: [
    {
      xOffset: -0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.23,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.23,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
  ],
  15: [
    {
      xOffset: -0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.23,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.23,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
  ],
  16: [
    {
      xOffset: -0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: 0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: -0.1,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.35,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: -0.1125,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.1125,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
    {
      xOffset: 0.35,
      yOffset: -0.3,
      scaleFactor: 0.35,
    },
  ],
};

export function getTokenAlignmentData(numberOfTokensInOneTile: number): TTokenAlignmentData[] {
  if (numberOfTokensInOneTile > 16 || numberOfTokensInOneTile <= 0)
    throw new Error('Invalid numberOfTokensInOneTile');
  return tokenAlignmentData[numberOfTokensInOneTile];
}

export const homeTokenAlignmentData: Record<TPlayerColour, Record<number, TTokenAlignmentData[]>> = {
  blue: {
    1: [{ xOffset: 0, yOffset: 0.1, scaleFactor: 0.75 }],
    2: [
      { xOffset: -0.2, yOffset: 0.2, scaleFactor: 0.65 },
      { xOffset: 0.2, yOffset: 0.2, scaleFactor: 0.65 },
    ],
    3: [
      { xOffset: -0.22, yOffset: 0.22, scaleFactor: 0.55 },
      { xOffset: 0.22, yOffset: 0.22, scaleFactor: 0.55 },
      { xOffset: 0, yOffset: -0.12, scaleFactor: 0.55 },
    ],
    4: [
      { xOffset: -0.25, yOffset: 0.25, scaleFactor: 0.45 },
      { xOffset: 0.25, yOffset: 0.25, scaleFactor: 0.45 },
      { xOffset: -0.12, yOffset: 0.02, scaleFactor: 0.45 },
      { xOffset: 0.12, yOffset: 0.02, scaleFactor: 0.45 },
    ],
  },
  green: {
    1: [{ xOffset: 0, yOffset: -0.1, scaleFactor: 0.75 }],
    2: [
      { xOffset: -0.2, yOffset: -0.2, scaleFactor: 0.65 },
      { xOffset: 0.2, yOffset: -0.2, scaleFactor: 0.65 },
    ],
    3: [
      { xOffset: -0.22, yOffset: -0.22, scaleFactor: 0.55 },
      { xOffset: 0.22, yOffset: -0.22, scaleFactor: 0.55 },
      { xOffset: 0, yOffset: 0.12, scaleFactor: 0.55 },
    ],
    4: [
      { xOffset: -0.25, yOffset: -0.25, scaleFactor: 0.45 },
      { xOffset: 0.25, yOffset: -0.25, scaleFactor: 0.45 },
      { xOffset: -0.12, yOffset: -0.02, scaleFactor: 0.45 },
      { xOffset: 0.12, yOffset: -0.02, scaleFactor: 0.45 },
    ],
  },
  red: {
    1: [{ xOffset: -0.1, yOffset: 0, scaleFactor: 0.75 }],
    2: [
      { xOffset: -0.2, yOffset: -0.2, scaleFactor: 0.65 },
      { xOffset: -0.2, yOffset: 0.2, scaleFactor: 0.65 },
    ],
    3: [
      { xOffset: -0.22, yOffset: -0.22, scaleFactor: 0.55 },
      { xOffset: -0.22, yOffset: 0.22, scaleFactor: 0.55 },
      { xOffset: 0.12, yOffset: 0, scaleFactor: 0.55 },
    ],
    4: [
      { xOffset: -0.25, yOffset: -0.25, scaleFactor: 0.45 },
      { xOffset: -0.25, yOffset: 0.25, scaleFactor: 0.45 },
      { xOffset: -0.02, yOffset: -0.12, scaleFactor: 0.45 },
      { xOffset: -0.02, yOffset: 0.12, scaleFactor: 0.45 },
    ],
  },
  yellow: {
    1: [{ xOffset: 0.1, yOffset: 0, scaleFactor: 0.75 }],
    2: [
      { xOffset: 0.2, yOffset: -0.2, scaleFactor: 0.65 },
      { xOffset: 0.2, yOffset: 0.2, scaleFactor: 0.65 },
    ],
    3: [
      { xOffset: 0.22, yOffset: -0.22, scaleFactor: 0.55 },
      { xOffset: 0.22, yOffset: 0.22, scaleFactor: 0.55 },
      { xOffset: -0.12, yOffset: 0, scaleFactor: 0.55 },
    ],
    4: [
      { xOffset: 0.25, yOffset: -0.25, scaleFactor: 0.45 },
      { xOffset: 0.25, yOffset: 0.25, scaleFactor: 0.45 },
      { xOffset: 0.02, yOffset: -0.12, scaleFactor: 0.45 },
      { xOffset: 0.02, yOffset: 0.12, scaleFactor: 0.45 },
    ],
  },
};

export function getHomeTokenAlignmentData(colour: TPlayerColour, count: number): TTokenAlignmentData[] {
  if (count > 4 || count <= 0) return getTokenAlignmentData(count);
  return homeTokenAlignmentData[colour][count];
}

export function applyAlignmentData(tokens: TToken[], dispatch: Dispatch<UnknownAction>) {
  if (!tokens.every((t) => areCoordsEqual(t.coordinates, tokens[0].coordinates)))
    throw new Error('All tokens must have the same coordinate');

  const reachedHome = tokens[0].hasTokenReachedHome;
  const alignmentData = reachedHome
    ? getHomeTokenAlignmentData(tokens[0].colour, tokens.length)
    : getTokenAlignmentData(tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    dispatch(
      setTokenAlignmentData({
        colour: token.colour,
        id: token.id,
        newAlignmentData: alignmentData[i],
      })
    );
  }
}
