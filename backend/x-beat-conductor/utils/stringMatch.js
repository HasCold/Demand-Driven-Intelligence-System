function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s) {
  const norm = normalizeText(s);
  if (!norm) return new Set();
  return new Set(norm.split(" ").filter(Boolean));
}

function jaccard(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function includesScore(candidate, query) {
  const c = normalizeText(candidate);
  const q = normalizeText(query);
  if (!c || !q) return 0;
  if (c === q) return 1;
  if (c.includes(q)) return Math.min(0.95, 0.6 + (q.length / c.length) * 0.4);
  if (q.includes(c)) return Math.min(0.9, 0.55 + (c.length / q.length) * 0.35);
  return 0;
}

function scoreTitleMatch({ candidateTitle, productName, keywords = [] }) {
  const nameScore = Math.max(
    includesScore(candidateTitle, productName),
    jaccard(candidateTitle, productName)
  );

  const kwScores = (Array.isArray(keywords) ? keywords : [])
    .map((kw) => Math.max(includesScore(candidateTitle, kw), jaccard(candidateTitle, kw)))
    .filter((n) => Number.isFinite(n));

  const keywordScore = kwScores.length ? Math.max(...kwScores) : 0;

  // Weight: title must look like product name; keywords are supporting signal.
  return Math.max(nameScore * 0.8 + keywordScore * 0.2, nameScore);
}

module.exports = { normalizeText, scoreTitleMatch };

