import { createDeck, shuffle } from './deck.js';
import { evaluate, compare, dealerQualifies } from './hand3.js';
import { bestOfSix } from './sixCardBonus.js';
import { settle } from './payouts.js';
import { PRE_DEAL_ODDS, liveOdds } from './probability.js';
import { loadBankroll, saveBankroll, resetBankroll } from './storage.js';
import { renderHand, renderPreDealOdds, renderLiveOdds, renderResult, fmtMoney } from './ui.js';

const STATE = { BETTING: 'BETTING', DEALT: 'DEALT', SHOWDOWN: 'SHOWDOWN' };

const game = {
  bankroll: loadBankroll(),
  bets: { ante: 0, pairPlus: 0, sixCard: 0 },
  state: STATE.BETTING,
  deck: null,
  player: null,
  dealer: null,
  playerEval: null,
};

const els = {};

function $(id) { return document.getElementById(id); }

function init() {
  els.bankroll       = $('bankroll');
  els.dealerCards    = $('dealer-cards');
  els.playerCards    = $('player-cards');
  els.playerLabel    = $('player-label');
  els.dealerLabel    = $('dealer-label');
  els.preDealOdds    = $('pre-deal-odds');
  els.liveOdds       = $('live-odds');
  els.resultPanel    = $('result-panel');
  els.anteBet        = $('bet-ante');
  els.ppBet          = $('bet-pp');
  els.sixBet         = $('bet-six');
  els.playBet        = $('bet-play');
  els.dealBtn        = $('btn-deal');
  els.playBtn        = $('btn-play');
  els.foldBtn        = $('btn-fold');
  els.nextBtn        = $('btn-next');
  els.resetBtn       = $('btn-reset');

  renderPreDealOdds(els.preDealOdds, PRE_DEAL_ODDS);
  renderLiveOdds(els.liveOdds, null);

  // Bet chip buttons
  document.querySelectorAll('[data-bet]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = btn.dataset.bet;
      const amount = Number(btn.dataset.amount);
      const remove = e.shiftKey || e.button === 2;
      adjustBet(target, remove ? -amount : amount);
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const target = btn.dataset.bet;
      const amount = Number(btn.dataset.amount);
      adjustBet(target, -amount);
    });
  });

  document.querySelectorAll('[data-clear]').forEach((btn) => {
    btn.addEventListener('click', () => clearBet(btn.dataset.clear));
  });

  els.dealBtn.addEventListener('click', deal);
  els.playBtn.addEventListener('click', () => decision(true));
  els.foldBtn.addEventListener('click', () => decision(false));
  els.nextBtn.addEventListener('click', resetForNextHand);
  els.resetBtn.addEventListener('click', () => {
    if (confirm('Reset bankroll to $1,000?')) {
      game.bankroll = resetBankroll();
      updateUI();
    }
  });

  updateUI();
}

function adjustBet(target, delta) {
  if (game.state !== STATE.BETTING) return;
  const next = Math.max(0, game.bets[target] + delta);
  const others = Object.entries(game.bets).filter(([k]) => k !== target).reduce((s, [, v]) => s + v, 0);
  if (next + others > game.bankroll) return;
  game.bets[target] = next;
  updateUI();
}

function clearBet(target) {
  if (game.state !== STATE.BETTING) return;
  game.bets[target] = 0;
  updateUI();
}

function deal() {
  if (game.state !== STATE.BETTING) return;
  if (game.bets.ante <= 0) {
    flash(els.anteBet, 'Ante required');
    return;
  }
  const totalAtRisk = game.bets.ante * 2 + game.bets.pairPlus + game.bets.sixCard;
  if (totalAtRisk > game.bankroll) {
    alert('Not enough bankroll to cover Ante + potential Play raise.');
    return;
  }

  game.deck = shuffle(createDeck());
  game.player = [game.deck[0], game.deck[1], game.deck[2]];
  game.dealer = [game.deck[3], game.deck[4], game.deck[5]];
  game.playerEval = evaluate(game.player);
  game.state = STATE.DEALT;

  renderHand(els.playerCards, game.player);
  renderHand(els.dealerCards, game.dealer, { faceDown: true });
  els.playerLabel.textContent = game.playerEval.label;
  els.dealerLabel.textContent = '???';
  els.resultPanel.innerHTML = '';

  const odds = liveOdds(game.player, createDeck());
  renderLiveOdds(els.liveOdds, odds);

  updateUI();
}

function decision(played) {
  if (game.state !== STATE.DEALT) return;

  const dealerEval = evaluate(game.dealer);
  const cmp = compare(game.playerEval, dealerEval);
  const dq = dealerQualifies(dealerEval);

  let sixCardEval = null;
  if (game.bets.sixCard > 0) {
    sixCardEval = bestOfSix([...game.player, ...game.dealer]);
  }

  let lines;
  if (!played) {
    lines = settle({
      bets: game.bets,
      played: false,
      folded: true,
      comparison: cmp,
      playerEval: game.playerEval,
      dealerQualifies: dq,
      sixCardEval,
    });
  } else {
    lines = settle({
      bets: game.bets,
      played: true,
      folded: false,
      comparison: cmp,
      playerEval: game.playerEval,
      dealerQualifies: dq,
      sixCardEval,
    });
  }

  const totalDelta = lines.reduce((s, l) => s + l.delta, 0);
  game.bankroll += totalDelta;
  saveBankroll(game.bankroll);
  game.state = STATE.SHOWDOWN;

  renderHand(els.dealerCards, game.dealer);
  els.dealerLabel.textContent = `${dealerEval.label}${dq ? '' : ' (does not qualify)'}`;
  renderResult(els.resultPanel, lines, totalDelta);

  updateUI();
}

function resetForNextHand() {
  game.state = STATE.BETTING;
  game.player = null;
  game.dealer = null;
  game.playerEval = null;
  // Keep bets so the player can repeat the same wager easily.
  if (game.bets.ante + game.bets.pairPlus + game.bets.sixCard > game.bankroll) {
    game.bets = { ante: 0, pairPlus: 0, sixCard: 0 };
  }
  els.playerCards.innerHTML = '';
  els.dealerCards.innerHTML = '';
  els.playerLabel.textContent = '';
  els.dealerLabel.textContent = '';
  els.resultPanel.innerHTML = '';
  renderLiveOdds(els.liveOdds, null);
  updateUI();
}

function updateUI() {
  els.bankroll.textContent = fmtMoney(game.bankroll);
  els.anteBet.textContent  = fmtMoney(game.bets.ante);
  els.ppBet.textContent    = fmtMoney(game.bets.pairPlus);
  els.sixBet.textContent   = fmtMoney(game.bets.sixCard);
  els.playBet.textContent  = game.state === STATE.SHOWDOWN || (game.state === STATE.DEALT)
    ? fmtMoney(0)
    : fmtMoney(0);

  // Buttons
  els.dealBtn.disabled = game.state !== STATE.BETTING || game.bets.ante <= 0;
  els.playBtn.disabled = game.state !== STATE.DEALT;
  els.foldBtn.disabled = game.state !== STATE.DEALT;
  els.nextBtn.disabled = game.state !== STATE.SHOWDOWN;

  document.body.dataset.state = game.state;
}

function flash(el, msg) {
  const old = el.textContent;
  el.textContent = msg;
  el.classList.add('flash');
  setTimeout(() => {
    el.textContent = old;
    el.classList.remove('flash');
  }, 1200);
}

document.addEventListener('DOMContentLoaded', init);
