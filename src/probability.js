import { evaluate, compare, dealerQualifies, RANK } from './hand3.js';

// Pre-deal probabilities for a fresh 3-card hand from a 52-card deck.
// C(52,3) = 22100 total combinations.
export const PRE_DEAL_ODDS = [
  { rank: RANK.STRAIGHT_FLUSH,   label: 'Straight Flush',   pct: 48    / 22100 * 100 },
  { rank: RANK.THREE_OF_A_KIND,  label: 'Three of a Kind',  pct: 52    / 22100 * 100 },
  { rank: RANK.STRAIGHT,         label: 'Straight',         pct: 720   / 22100 * 100 },
  { rank: RANK.FLUSH,            label: 'Flush',            pct: 1096  / 22100 * 100 },
  { rank: RANK.PAIR,             label: 'Pair',             pct: 3744  / 22100 * 100 },
  { rank: RANK.HIGH_CARD,        label: 'High Card',        pct: 16440 / 22100 * 100 },
];

// Enumerate all C(49,3) = 18424 dealer hands given the 3 player cards.
// Returns:
//   { winPct, tiePct, losePct, dealerQualifyPct, dealerRankCounts, total }
export function liveOdds(playerCards, fullDeck) {
  const playerEval = evaluate(playerCards);
  const ids = new Set(playerCards.map((c) => c.id));
  const remaining = fullDeck.filter((c) => !ids.has(c.id));

  let win = 0, tie = 0, lose = 0, qualify = 0, total = 0;
  const rankCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const n = remaining.length;
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const dealerHand = [remaining[i], remaining[j], remaining[k]];
        const dEval = evaluate(dealerHand);
        rankCounts[dEval.rank]++;
        if (dealerQualifies(dEval)) qualify++;
        const cmp = compare(playerEval, dEval);
        if (cmp > 0) win++;
        else if (cmp < 0) lose++;
        else tie++;
        total++;
      }
    }
  }

  return {
    winPct: (win / total) * 100,
    tiePct: (tie / total) * 100,
    losePct: (lose / total) * 100,
    dealerQualifyPct: (qualify / total) * 100,
    dealerRankCounts: rankCounts,
    total,
    playerEval,
  };
}
