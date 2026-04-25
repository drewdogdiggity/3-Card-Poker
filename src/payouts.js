import { RANK as R3 } from './hand3.js';
import { RANK5 as R5 } from './hand5.js';

export const ANTE_BONUS = {
  [R3.STRAIGHT]: 1,
  [R3.THREE_OF_A_KIND]: 4,
  [R3.STRAIGHT_FLUSH]: 5,
};

export const PAIR_PLUS = {
  [R3.PAIR]: 1,
  [R3.FLUSH]: 4,
  [R3.STRAIGHT]: 6,
  [R3.THREE_OF_A_KIND]: 30,
  [R3.STRAIGHT_FLUSH]: 40,
};

export const SIX_CARD_BONUS = {
  [R5.THREE_OF_A_KIND]: 5,
  [R5.STRAIGHT]: 10,
  [R5.FLUSH]: 15,
  [R5.FULL_HOUSE]: 25,
  [R5.FOUR_OF_A_KIND]: 50,
  [R5.STRAIGHT_FLUSH]: 200,
  [R5.ROYAL_FLUSH]: 1000,
};

// Returns array of line items: { label, delta } where delta is signed payout.
// bets: { ante, pairPlus, sixCard }, played: bool, comparison: 1/0/-1 (player vs dealer),
// playerEval: hand3 result, dealerEval: hand3 result, dealerQualifies: bool, sixCardEval: hand5 result.
export function settle({ bets, played, folded, comparison, playerEval, dealerQualifies, sixCardEval }) {
  const lines = [];

  // Pair Plus resolves regardless of fold (standard rule: paid on dealt hand).
  if (bets.pairPlus > 0) {
    const mult = PAIR_PLUS[playerEval.rank];
    if (mult) {
      lines.push({ label: `Pair Plus (${rankWord(playerEval.rank)}) ${mult}:1`, delta: bets.pairPlus * mult });
    } else {
      lines.push({ label: 'Pair Plus loses', delta: -bets.pairPlus });
    }
  }

  // 6-Card Bonus also resolves regardless of fold (uses all 6 cards).
  if (bets.sixCard > 0 && sixCardEval) {
    const mult = SIX_CARD_BONUS[sixCardEval.rank];
    if (mult) {
      lines.push({ label: `6-Card Bonus (${sixCardEval.label}) ${mult}:1`, delta: bets.sixCard * mult });
    } else {
      lines.push({ label: '6-Card Bonus loses', delta: -bets.sixCard });
    }
  }

  if (folded) {
    lines.push({ label: 'Ante forfeited (fold)', delta: -bets.ante });
    return lines;
  }

  // Ante bonus pays on player hand regardless of dealer outcome.
  const anteBonusMult = ANTE_BONUS[playerEval.rank];
  if (anteBonusMult) {
    lines.push({ label: `Ante Bonus (${rankWord(playerEval.rank)}) ${anteBonusMult}:1`, delta: bets.ante * anteBonusMult });
  }

  if (!dealerQualifies) {
    lines.push({ label: "Dealer doesn't qualify — Ante pays 1:1, Play pushes", delta: bets.ante });
    // Play bet returned (no delta).
    return lines;
  }

  if (comparison > 0) {
    lines.push({ label: 'Ante wins 1:1', delta: bets.ante });
    lines.push({ label: 'Play wins 1:1', delta: bets.ante });
  } else if (comparison < 0) {
    lines.push({ label: 'Ante loses', delta: -bets.ante });
    lines.push({ label: 'Play loses', delta: -bets.ante });
  } else {
    lines.push({ label: 'Ante pushes', delta: 0 });
    lines.push({ label: 'Play pushes', delta: 0 });
  }

  return lines;
}

function rankWord(rank) {
  return ({
    [R3.PAIR]: 'Pair',
    [R3.FLUSH]: 'Flush',
    [R3.STRAIGHT]: 'Straight',
    [R3.THREE_OF_A_KIND]: 'Trips',
    [R3.STRAIGHT_FLUSH]: 'Straight Flush',
  })[rank] || '';
}
