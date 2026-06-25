import { FORWARD_TOKEN_TRANSITION_TIME } from '../game/tokens/constants';
import { getTokenDOMId } from '../game/tokens/logic';
import type { TToken } from '../types';

export function setTokenTransitionTime(transitionTime: number, { colour, id }: TToken) {
  const token = document.getElementById(getTokenDOMId(colour, id));
  const timingFn = transitionTime === FORWARD_TOKEN_TRANSITION_TIME ? 'ease-in-out' : 'linear';
  // Set ONLY on the specific token element — not on .game.
  // Setting on .game forces a CSS style recalculation on every child in the
  // entire game tree (100+ elements) on every single step, causing layout jank.
  if (!token) return;
  token.style.setProperty('--token-transition-time', `${transitionTime}ms`);
  token.style.setProperty('--token-transition-timing-fn', timingFn);
}
