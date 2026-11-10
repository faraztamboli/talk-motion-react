/** 500, "usd", "month" -> "$5.00 / month"; 0 -> "Free". */
export function formatPrice(cents, currency = "usd", interval) {
  const amount = Number(cents) || 0;
  if (amount === 0) return "Free";
  let text;
  try {
    text = new Intl.NumberFormat(undefined, { style: "currency", currency: String(currency || "usd").toUpperCase() }).format(amount / 100);
  } catch {
    text = `${(amount / 100).toFixed(2)} ${String(currency || "").toUpperCase()}`;
  }
  return interval && interval !== "once" ? `${text} / ${interval}` : text;
}

/** "5" or "5.5" dollars -> 500 / 550 cents; invalid -> null. */
export function toCents(value) {
  const n = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** { month: { usd: 700 }, once: { usd: 0 } } -> ["$7.00 / month"] (zero totals dropped). */
export function formatTotals(totals = {}) {
  const out = [];
  for (const [interval, byCurrency] of Object.entries(totals)) {
    for (const [currency, cents] of Object.entries(byCurrency)) {
      if (cents > 0) out.push(formatPrice(cents, currency, interval));
    }
  }
  return out;
}
