import { evaluate5 } from './hand5.js';

// Choose 5 from 6 cards: 6 combinations, drop one card at a time.
export function bestOfSix(sixCards) {
  if (sixCards.length !== 6) throw new Error('bestOfSix requires 6 cards');
  let best = null;
  for (let drop = 0; drop < 6; drop++) {
    const five = sixCards.filter((_, i) => i !== drop);
    const ev = evaluate5(five);
    if (!best || ev.rank > best.rank ||
        (ev.rank === best.rank && compareKickers(ev.kickers, best.kickers) > 0)) {
      best = ev;
    }
  }
  return best;
}

function compareKickers(a, b) {
  for (let i = 0; i < a.length; i++) {
    const ak = a[i];
    const bk = b[i] ?? 0;
    if (ak !== bk) return ak > bk ? 1 : -1;
  }
  return 0;
}
