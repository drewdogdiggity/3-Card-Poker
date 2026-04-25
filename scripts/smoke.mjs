// Sanity tests for evaluators and probability. Run: node scripts/smoke.mjs
import { createDeck, RANK_LABEL } from '../src/deck.js';
import { evaluate, compare, dealerQualifies, RANK } from '../src/hand3.js';
import { evaluate5, RANK5 } from '../src/hand5.js';
import { bestOfSix } from '../src/sixCardBonus.js';
import { liveOdds, PRE_DEAL_ODDS } from '../src/probability.js';

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ok  ', name); }
  else      { fail++; console.log('  FAIL', name); }
}

const c = (rank, suit) => ({ rank, suit, id: `${RANK_LABEL[rank]}${suit}` });

console.log('\n-- hand3.evaluate --');
check('Straight Flush A-K-Q♠',
  evaluate([c(14, 'S'), c(13, 'S'), c(12, 'S')]).rank === RANK.STRAIGHT_FLUSH);
check('Wheel straight flush A-2-3♣',
  evaluate([c(14, 'C'), c(2, 'C'), c(3, 'C')]).rank === RANK.STRAIGHT_FLUSH);
check('Three of a Kind 7-7-7',
  evaluate([c(7, 'S'), c(7, 'H'), c(7, 'D')]).rank === RANK.THREE_OF_A_KIND);
check('Straight A-2-3 (wheel)',
  evaluate([c(14, 'S'), c(2, 'H'), c(3, 'D')]).rank === RANK.STRAIGHT);
check('Straight A-K-Q',
  evaluate([c(14, 'S'), c(13, 'H'), c(12, 'D')]).rank === RANK.STRAIGHT);
check('Flush Q-J-5♠',
  evaluate([c(12, 'S'), c(11, 'S'), c(5, 'S')]).rank === RANK.FLUSH);
check('Pair 8-8-K',
  evaluate([c(8, 'S'), c(8, 'H'), c(13, 'D')]).rank === RANK.PAIR);
check('High card 2-7-Q',
  evaluate([c(2, 'S'), c(7, 'H'), c(12, 'D')]).rank === RANK.HIGH_CARD);

console.log('\n-- compare / dealerQualifies --');
check('Trips beats Straight',
  compare(evaluate([c(7,'S'),c(7,'H'),c(7,'D')]), evaluate([c(5,'S'),c(6,'H'),c(7,'C')])) > 0);
check('Higher pair beats lower pair',
  compare(evaluate([c(13,'S'),c(13,'H'),c(2,'D')]), evaluate([c(12,'S'),c(12,'H'),c(14,'D')])) > 0);
check('Dealer qualifies on Q-high',
  dealerQualifies(evaluate([c(12,'S'),c(8,'H'),c(2,'D')])) === true);
check('Dealer NOT qualified on J-high',
  dealerQualifies(evaluate([c(11,'S'),c(8,'H'),c(2,'D')])) === false);
check('Dealer qualifies on any pair',
  dealerQualifies(evaluate([c(2,'S'),c(2,'H'),c(3,'D')])) === true);

console.log('\n-- hand5.evaluate5 --');
check('Royal Flush',
  evaluate5([c(14,'S'),c(13,'S'),c(12,'S'),c(11,'S'),c(10,'S')]).rank === RANK5.ROYAL_FLUSH);
check('Wheel straight flush 5-high',
  evaluate5([c(14,'D'),c(2,'D'),c(3,'D'),c(4,'D'),c(5,'D')]).rank === RANK5.STRAIGHT_FLUSH);
check('Quads',
  evaluate5([c(8,'S'),c(8,'H'),c(8,'D'),c(8,'C'),c(2,'S')]).rank === RANK5.FOUR_OF_A_KIND);
check('Full House',
  evaluate5([c(8,'S'),c(8,'H'),c(8,'D'),c(2,'C'),c(2,'S')]).rank === RANK5.FULL_HOUSE);
check('Flush',
  evaluate5([c(2,'S'),c(5,'S'),c(7,'S'),c(11,'S'),c(13,'S')]).rank === RANK5.FLUSH);
check('Straight (broadway)',
  evaluate5([c(14,'S'),c(13,'H'),c(12,'D'),c(11,'C'),c(10,'S')]).rank === RANK5.STRAIGHT);
check('Two Pair',
  evaluate5([c(8,'S'),c(8,'H'),c(2,'D'),c(2,'C'),c(7,'S')]).rank === RANK5.TWO_PAIR);

console.log('\n-- bestOfSix --');
const six = [c(14,'S'),c(13,'S'),c(12,'S'),c(11,'S'),c(10,'S'),c(2,'C')];
check('Royal flush from 6 cards',
  bestOfSix(six).rank === RANK5.ROYAL_FLUSH);

console.log('\n-- pre-deal odds sum to 100% --');
const sum = PRE_DEAL_ODDS.reduce((s, r) => s + r.pct, 0);
check(`Sum = ${sum.toFixed(6)}%`, Math.abs(sum - 100) < 1e-9);

console.log('\n-- liveOdds: A♠ K♠ Q♠ vs all dealer hands --');
const player = [c(14,'S'), c(13,'S'), c(12,'S')];
const odds = liveOdds(player, createDeck());
console.log(`  win=${odds.winPct.toFixed(2)}% tie=${odds.tiePct.toFixed(2)}% lose=${odds.losePct.toFixed(2)}% total=${odds.total}`);
check('Total = 18424 (C(49,3))', odds.total === 18424);
check('Win >= 99% with royal-suited straight flush', odds.winPct > 99);
check('Sum approx 100', Math.abs(odds.winPct + odds.tiePct + odds.losePct - 100) < 1e-9);

console.log('\n-- liveOdds: 2♣ 3♦ 5♥ (weak high card) --');
const weak = [c(2,'C'), c(3,'D'), c(5,'H')];
const wOdds = liveOdds(weak, createDeck());
console.log(`  win=${wOdds.winPct.toFixed(2)}% lose=${wOdds.losePct.toFixed(2)}%`);
check('Weak hand wins < 5%', wOdds.winPct < 5);

// Verify dealer rank distribution matches known pre-deal frequencies
// (after removing the 3 player cards, ~same ratios; not exact, but close).
console.log('\n-- dealer rank distribution sanity --');
const total = wOdds.total;
const tripsPct = (wOdds.dealerRankCounts[RANK.THREE_OF_A_KIND] / total) * 100;
console.log(`  Trips ~${tripsPct.toFixed(3)}% (expect ~0.235%)`);
check('Trips% in [0.1%, 0.4%]', tripsPct > 0.1 && tripsPct < 0.4);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
