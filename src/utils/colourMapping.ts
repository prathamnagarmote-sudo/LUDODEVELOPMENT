import type { TCoordinate, TPlayerColour } from '../types';

/**
 * Returns the visual color for a given logical player color.
 * Symmetrical rotation mapping based on logical myPlayerColour:
 * - Blue: 0 deg rotation (Blue->Blue, Red->Red, Green->Green, Yellow->Yellow)
 * - Red: 90 deg CCW rotation (Red->Blue, Blue->Yellow, Yellow->Green, Green->Red)
 * - Green: 180 deg rotation (Green->Blue, Blue->Green, Red->Yellow, Yellow->Red)
 * - Yellow: 90 deg CW rotation (Yellow->Blue, Blue->Red, Red->Green, Green->Yellow)
 */
export function getVisualColour(
  logicalColour: TPlayerColour,
  isOnline: boolean,
  myPlayerColour: TPlayerColour | undefined
): TPlayerColour {
  if (!isOnline || !myPlayerColour) return logicalColour;
  if (myPlayerColour === 'blue') return logicalColour;

  if (myPlayerColour === 'red') {
    if (logicalColour === 'red') return 'blue';
    if (logicalColour === 'blue') return 'yellow';
    if (logicalColour === 'yellow') return 'green';
    if (logicalColour === 'green') return 'red';
  }

  if (myPlayerColour === 'green') {
    if (logicalColour === 'green') return 'blue';
    if (logicalColour === 'blue') return 'green';
    if (logicalColour === 'red') return 'yellow';
    if (logicalColour === 'yellow') return 'red';
  }

  if (myPlayerColour === 'yellow') {
    if (logicalColour === 'yellow') return 'blue';
    if (logicalColour === 'blue') return 'red';
    if (logicalColour === 'red') return 'green';
    if (logicalColour === 'green') return 'yellow';
  }

  return logicalColour;
}

/**
 * Inverse mapping of getVisualColour. Converts visual color back to logical color.
 */
export function getLogicalColour(
  visualColour: TPlayerColour,
  isOnline: boolean,
  myPlayerColour: TPlayerColour | undefined
): TPlayerColour {
  if (!isOnline || !myPlayerColour) return visualColour;
  if (myPlayerColour === 'blue') return visualColour;

  if (myPlayerColour === 'red') {
    if (visualColour === 'blue') return 'red';
    if (visualColour === 'yellow') return 'blue';
    if (visualColour === 'green') return 'yellow';
    if (visualColour === 'red') return 'green';
  }

  if (myPlayerColour === 'green') {
    if (visualColour === 'blue') return 'green';
    if (visualColour === 'green') return 'blue';
    if (visualColour === 'yellow') return 'red';
    if (visualColour === 'red') return 'yellow';
  }

  if (myPlayerColour === 'yellow') {
    if (visualColour === 'blue') return 'yellow';
    if (visualColour === 'red') return 'blue';
    if (visualColour === 'green') return 'red';
    if (visualColour === 'yellow') return 'green';
  }

  return visualColour;
}

/**
 * Translates logical board coordinates (0 to 14) to visual rotated coordinates.
 */
export function getVisualCoordinates(
  logicalCoords: TCoordinate,
  isOnline: boolean,
  myPlayerColour: TPlayerColour | undefined
): TCoordinate {
  if (!isOnline || !myPlayerColour) return logicalCoords;
  const { x, y } = logicalCoords;

  if (myPlayerColour === 'blue') return logicalCoords;

  if (myPlayerColour === 'red') {
    // 90 deg CCW: (y, 14 - x)
    return { x: y, y: 14 - x };
  }

  if (myPlayerColour === 'green') {
    // 180 deg: (14 - x, 14 - y)
    return { x: 14 - x, y: 14 - y };
  }

  if (myPlayerColour === 'yellow') {
    // 90 deg CW: (14 - y, x)
    return { x: 14 - y, y: x };
  }

  return logicalCoords;
}

/**
 * Translates visual board coordinates back to logical coordinates.
 */
export function getLogicalCoordinates(
  visualCoords: TCoordinate,
  isOnline: boolean,
  myPlayerColour: TPlayerColour | undefined
): TCoordinate {
  if (!isOnline || !myPlayerColour) return visualCoords;
  const { x, y } = visualCoords;

  if (myPlayerColour === 'blue') return visualCoords;

  if (myPlayerColour === 'red') {
    // Inverse of 90 deg CCW is 90 deg CW: (14 - y, x)
    return { x: 14 - y, y: x };
  }

  if (myPlayerColour === 'green') {
    // Inverse of 180 deg is 180 deg: (14 - x, 14 - y)
    return { x: 14 - x, y: 14 - y };
  }

  if (myPlayerColour === 'yellow') {
    // Inverse of 90 deg CW is 90 deg CCW: (y, 14 - x)
    return { x: y, y: 14 - x };
  }

  return visualCoords;
}
