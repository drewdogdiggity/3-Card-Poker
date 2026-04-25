const KEY_BANKROLL = 'tcp.bankroll';
const KEY_HISTORY = 'tcp.history';
const DEFAULT_BANKROLL = 1000;

export function loadBankroll() {
  try {
    const raw = localStorage.getItem(KEY_BANKROLL);
    if (raw === null) return DEFAULT_BANKROLL;
    const n = Number(raw);
    return Number.isFinite(n) ? n : DEFAULT_BANKROLL;
  } catch {
    return DEFAULT_BANKROLL;
  }
}

export function saveBankroll(n) {
  try { localStorage.setItem(KEY_BANKROLL, String(n)); } catch {}
}

export function resetBankroll() {
  try { localStorage.removeItem(KEY_BANKROLL); localStorage.removeItem(KEY_HISTORY); } catch {}
  return DEFAULT_BANKROLL;
}

export function pushHistory(entry, max = 50) {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    while (arr.length > max) arr.shift();
    localStorage.setItem(KEY_HISTORY, JSON.stringify(arr));
  } catch {}
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
