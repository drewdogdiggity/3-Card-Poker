export const RANK = {
  HIGH_CARD: 0,
  PAIR: 1,
  FLUSH: 2,
  STRAIGHT: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT_FLUSH: 5,
};

export const RANK_LABEL = {
  0: 'High Card',
  1: 'Pair',
  2: 'Flush',
  3: 'Straight',
  4: 'Three of a Kind',
  5: 'Straight Flush',
};

function isStraight(sortedDescRanks) {
  const [a, b, c] = sortedDescRanks;
  if (a - 1 === b && b - 1 === c) return { straight: true, high: a };
  // Wheel: A-2-3 (sorted desc = [14, 3, 2])
  if (a === 14 && b === 3 && c === 2) return { straight: true, high: 3 };
  return { straight: false, high: 0 };
}

export function evaluate(cards) {
  if (cards.length !== 3) throw new Error('hand3.evaluate requires 3 cards');
  const ranks = cards.map((c) => c.rank).sort((x, y) => y - x);
  const suits = cards.map((c) => c.suit);
  const flush = suits[0] === suits[1] && suits[1] === suits[2];
  const { straight, high: straightHigh } = isStraight(ranks);

  if (straight && flush) {
    return { rank: RANK.STRAIGHT_FLUSH, kickers: [straightHigh], label: RANK_LABEL[5] };
  }
  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
    return { rank: RANK.THREE_OF_A_KIND, kickers: [ranks[0]], label: RANK_LABEL[4] };
  }
  if (straight) {
    return { rank: RANK.STRAIGHT, kickers: [straightHigh], label: RANK_LABEL[3] };
  }
  if (flush) {
    return { rank: RANK.FLUSH, kickers: ranks, label: RANK_LABEL[2] };
  }
  if (ranks[0] === ranks[1]) {
    return { rank: RANK.PAIR, kickers: [ranks[0], ranks[2]], label: RANK_LABEL[1] };
  }
  if (ranks[1] === ranks[2]) {
    return { rank: RANK.PAIR, kickers: [ranks[1], ranks[0]], label: RANK_LABEL[1] };
  }
  return { rank: RANK.HIGH_CARD, kickers: ranks, label: RANK_LABEL[0] };
}

export function compare(a, b) {
  if (a.rank !== b.rank) return a.rank > b.rank ? 1 : -1;
  for (let i = 0; i < a.kickers.length; i++) {
    const ak = a.kickers[i];
    const bk = b.kickers[i] ?? 0;
    if (ak !== bk) return ak > bk ? 1 : -1;
  }
  return 0;
}

// Dealer qualifies on Queen-high or better.
export function dealerQualifies(evalResult, cards) {
  if (evalResult.rank > RANK.HIGH_CARD) return true;
  return evalResult.kickers[0] >= 12;
}
