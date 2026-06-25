import type { TPlayerColour } from '../types';

/**
 * Returns the visual color for a given logical player color.
 * For online matches, each player should see themselves as Blue.
 * To maintain unique colors for all players:
 * - If the local player's logical color is Blue, no changes are needed (returns logical color).
 * - Otherwise, swaps the local player's logical color and Blue, leaving Green and Yellow unchanged.
 */
export function getVisualColour(
  logicalColour: TPlayerColour,
  isOnline: boolean,
  myPlayerColour: TPlayerColour | undefined
): TPlayerColour {
  if (!isOnline || !myPlayerColour) return logicalColour;
  if (myPlayerColour === 'blue') return logicalColour;
  if (logicalColour === myPlayerColour) return 'blue';
  if (logicalColour === 'blue') return myPlayerColour;
  return logicalColour;
}
