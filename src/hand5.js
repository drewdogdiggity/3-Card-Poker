export const RANK5 = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

export const RANK5_LABEL = {
  0: 'High Card',
  1: 'Pair',
  2: 'Two Pair',
  3: 'Three of a Kind',
  4: 'Straight',
  5: 'Flush',
  6: 'Full House',
  7: 'Four of a Kind',
  8: 'Straight Flush',
  9: 'Royal Flush',
};

function straightHigh(ranksDesc) {
  const uniq = [...new Set(ranksDesc)];
  if (uniq.length !== 5) return 0;
  if (uniq[0] - uniq[4] === 4) return uniq[0];
  // Wheel: A-2-3-4-5 -> [14, 5, 4, 3, 2]
  if (uniq[0] === 14 && uniq[1] === 5 && uniq[2] === 4 && uniq[3] === 3 && uniq[4] === 2) return 5;
  return 0;
}

export function evaluate5(cards) {
  if (cards.length !== 5) throw new Error('hand5.evaluate5 requires 5 cards');
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);
  const sHigh = straightHigh(ranks);

  // Group by rank, sorted by (count desc, rank desc)
  const counts = new Map();
  for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (flush && sHigh === 14) return { rank: RANK5.ROYAL_FLUSH, kickers: [14], label: RANK5_LABEL[9] };
  if (flush && sHigh) return { rank: RANK5.STRAIGHT_FLUSH, kickers: [sHigh], label: RANK5_LABEL[8] };
  if (groups[0][1] === 4) return { rank: RANK5.FOUR_OF_A_KIND, kickers: [groups[0][0], groups[1][0]], label: RANK5_LABEL[7] };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { rank: RANK5.FULL_HOUSE, kickers: [groups[0][0], groups[1][0]], label: RANK5_LABEL[6] };
  if (flush) return { rank: RANK5.FLUSH, kickers: ranks, label: RANK5_LABEL[5] };
  if (sHigh) return { rank: RANK5.STRAIGHT, kickers: [sHigh], label: RANK5_LABEL[4] };
  if (groups[0][1] === 3) return { rank: RANK5.THREE_OF_A_KIND, kickers: [groups[0][0], groups[1][0], groups[2][0]], label: RANK5_LABEL[3] };
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const [hi, lo] = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    return { rank: RANK5.TWO_PAIR, kickers: [hi, lo, groups[2][0]], label: RANK5_LABEL[2] };
  }
  if (groups[0][1] === 2) return { rank: RANK5.PAIR, kickers: [groups[0][0], groups[1][0], groups[2][0], groups[3][0]], label: RANK5_LABEL[1] };
  return { rank: RANK5.HIGH_CARD, kickers: ranks, label: RANK5_LABEL[0] };
}
