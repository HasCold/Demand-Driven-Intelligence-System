function parsePriceToNumber(input) {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  const s = String(input ?? "");
  // Keep digits, comma, dot. Remove currency symbols.
  const cleaned = s.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return null;

  // Heuristic: if both comma and dot exist, assume comma is thousands separator.
  if (cleaned.includes(",") && cleaned.includes(".")) {
    const noCommas = cleaned.replace(/,/g, "");
    const n = Number.parseFloat(noCommas);
    return Number.isFinite(n) ? n : null;
  }

  // If only commas and no dots, treat comma as thousands separator (most common in PKR formatting)
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    const noCommas = cleaned.replace(/,/g, "");
    const n = Number.parseFloat(noCommas);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

module.exports = { parsePriceToNumber };

