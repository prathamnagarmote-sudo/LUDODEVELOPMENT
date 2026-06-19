import { useStore } from 'react-redux';
import type { TCoordinate } from '../types';
import type { TTokenAlignmentData } from '../types';
import type { RootState } from '../state/store';
import { useCallback } from 'react';

export const useCoordsToPosition = (): ((
  coords: TCoordinate,
  tokenAlignmentData: TTokenAlignmentData,
  hasTokenReachedHome?: boolean,
  colour?: import('../types').TPlayerColour
) => { x: string; y: string }) => {
  const store = useStore<RootState>();
  return useCallback(
    (coords: TCoordinate, tokenAlignmentData: TTokenAlignmentData, hasTokenReachedHome?: boolean, colour?: import('../types').TPlayerColour) => {
      const { boardTileSize, tokenHeight, tokenWidth } = store.getState().board;
      const { xOffset, yOffset } = tokenAlignmentData;

      let homeXOffset = 0;
      let homeYOffset = 0;
      const yOffsetFactor = 0.85;
      let currentYOffsetFactor = yOffsetFactor;

      if (hasTokenReachedHome && colour) {
        currentYOffsetFactor = 0.5; // Visually center the token anchor
        // The offset of 0.12 places the token exactly at the incenter of the triangle
        // (equidistant from the base and the two diagonal sides)
        if (colour === 'red') homeXOffset = 0.12;
        if (colour === 'blue') homeYOffset = -0.12;
        if (colour === 'green') homeYOffset = 0.12;
        if (colour === 'yellow') homeXOffset = -0.12;
      }

      const tileCenterX = (coords.x + 0.5 + homeXOffset) * boardTileSize;
      const tileCenterY = (coords.y + 0.5 + homeYOffset) * boardTileSize;

      const x = `${tileCenterX - tokenWidth / 2 + xOffset * boardTileSize}px`;
      const y = `${tileCenterY - tokenHeight * currentYOffsetFactor + yOffset * boardTileSize}px`;
      return { x, y };
    },
    [store]
  );
};
