import { useStore } from 'react-redux';
import type { TCoordinate } from '../types';
import type { TTokenAlignmentData } from '../types';
import type { RootState } from '../state/store';
import { useCallback, useContext } from 'react';
import { OnlineGameContext } from '../pages/Play/components/Game/Game';
import { getVisualCoordinates, getVisualColour } from '../utils/colourMapping';

export const useCoordsToPosition = (): ((
  coords: TCoordinate,
  tokenAlignmentData: TTokenAlignmentData,
  hasTokenReachedHome?: boolean,
  colour?: import('../types').TPlayerColour
) => { x: string; y: string }) => {
  const store = useStore<RootState>();
  const onlineContext = useContext(OnlineGameContext);
  const isOnline = !!onlineContext?.isOnline;
  const myPlayerColour = onlineContext?.myPlayerColour;

  return useCallback(
    (coords: TCoordinate, tokenAlignmentData: TTokenAlignmentData, hasTokenReachedHome?: boolean, colour?: import('../types').TPlayerColour) => {
      const { boardTileSize, tokenHeight, tokenWidth } = store.getState().board;
      const { xOffset, yOffset } = tokenAlignmentData;

      // 1. Rotate the coordinate first
      const rotatedCoords = getVisualCoordinates(coords, isOnline, myPlayerColour);

      let homeXOffset = 0;
      let homeYOffset = 0;
      const yOffsetFactor = 0.85;
      let currentYOffsetFactor = yOffsetFactor;

      if (hasTokenReachedHome && colour) {
        currentYOffsetFactor = 0.5; // Visually center the token anchor
        // The offset of 0.12 places the token exactly at the incenter of the triangle
        // (equidistant from the base and the two diagonal sides)
        const visualColour = getVisualColour(colour, isOnline, myPlayerColour);
        if (visualColour === 'red') homeXOffset = 0.12;
        if (visualColour === 'blue') homeYOffset = -0.12;
        if (visualColour === 'green') homeYOffset = 0.12;
        if (visualColour === 'yellow') homeXOffset = -0.12;
      }

      const tileCenterX = (rotatedCoords.x + 0.5 + homeXOffset) * boardTileSize;
      const tileCenterY = (rotatedCoords.y + 0.5 + homeYOffset) * boardTileSize;

      const x = `${tileCenterX - tokenWidth / 2 + xOffset * boardTileSize}px`;
      const y = `${tileCenterY - tokenHeight * currentYOffsetFactor + yOffset * boardTileSize}px`;
      return { x, y };
    },
    [store, isOnline, myPlayerColour]
  );
};
