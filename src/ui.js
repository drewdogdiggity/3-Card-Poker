import { RANK_LABEL as RANK_LABEL_CARD, SUIT_GLYPH, SUIT_COLOR } from './deck.js';
import { RANK_LABEL as HAND_LABEL } from './hand3.js';

export function renderCard(card, { faceDown = false } = {}) {
  const el = document.createElement('div');
  el.className = `card ${faceDown ? 'face-down' : ''} suit-${SUIT_COLOR[card.suit]}`;
  if (faceDown) {
    el.innerHTML = '<div class="card-back"></div>';
    return el;
  }
  el.innerHTML = `
    <div class="corner top">${RANK_LABEL_CARD[card.rank]}<br>${SUIT_GLYPH[card.suit]}</div>
    <div class="center">${SUIT_GLYPH[card.suit]}</div>
    <div class="corner bot">${RANK_LABEL_CARD[card.rank]}<br>${SUIT_GLYPH[card.suit]}</div>
  `;
  return el;
}

export function renderHand(container, cards, { faceDown = false } = {}) {
  container.innerHTML = '';
  for (const c of cards) container.appendChild(renderCard(c, { faceDown }));
}

export function fmtMoney(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

export function fmtSignedMoney(n) {
  if (n === 0) return '$0';
  const sign = n > 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

export function renderPreDealOdds(container, oddsTable) {
  container.innerHTML = '';
  for (const row of oddsTable) {
    const li = document.createElement('div');
    li.className = 'odds-row';
    li.innerHTML = `<span>${row.label}</span><span>${row.pct.toFixed(2)}%</span>`;
    container.appendChild(li);
  }
}

export function renderLiveOdds(container, odds) {
  container.innerHTML = '';
  if (!odds) {
    container.innerHTML = '<div class="muted">Deal a hand to see live odds.</div>';
    return;
  }
  const rows = [
    ['Win',  odds.winPct.toFixed(2) + '%', 'win'],
    ['Tie',  odds.tiePct.toFixed(2) + '%', 'tie'],
    ['Lose', odds.losePct.toFixed(2) + '%', 'lose'],
    ['Dealer qualifies', odds.dealerQualifyPct.toFixed(2) + '%', ''],
  ];
  for (const [label, val, cls] of rows) {
    const r = document.createElement('div');
    r.className = `odds-row ${cls}`;
    r.innerHTML = `<span>${label}</span><span>${val}</span>`;
    container.appendChild(r);
  }
  const sub = document.createElement('div');
  sub.className = 'muted small';
  sub.textContent = `Across all ${odds.total.toLocaleString()} possible dealer hands`;
  container.appendChild(sub);

  const dist = document.createElement('div');
  dist.className = 'dealer-dist';
  dist.innerHTML = '<div class="dist-title">Dealer hand distribution</div>';
  for (let r = 5; r >= 0; r--) {
    const count = odds.dealerRankCounts[r];
    const pct = (count / odds.total) * 100;
    const row = document.createElement('div');
    row.className = 'odds-row';
    row.innerHTML = `<span>${HAND_LABEL[r]}</span><span>${pct.toFixed(2)}%</span>`;
    dist.appendChild(row);
  }
  container.appendChild(dist);
}

export function renderResult(container, lines, totalDelta) {
  container.innerHTML = '';
  if (!lines || lines.length === 0) return;
  for (const ln of lines) {
    const row = document.createElement('div');
    const cls = ln.delta > 0 ? 'win' : (ln.delta < 0 ? 'lose' : 'tie');
    row.className = `result-row ${cls}`;
    row.innerHTML = `<span>${ln.label}</span><span>${fmtSignedMoney(ln.delta)}</span>`;
    container.appendChild(row);
  }
  const sum = document.createElement('div');
  const cls = totalDelta > 0 ? 'win' : (totalDelta < 0 ? 'lose' : 'tie');
  sum.className = `result-row total ${cls}`;
  sum.innerHTML = `<span>Net</span><span>${fmtSignedMoney(totalDelta)}</span>`;
  container.appendChild(sum);
}
