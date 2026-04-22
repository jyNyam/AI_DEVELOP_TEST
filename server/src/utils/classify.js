// server/src/utils/classify.js

export function classifyRange(tScore, isComposite = false) {
  if (tScore == null || Number.isNaN(Number(tScore))) return null;

  const score = Number(tScore);

  if (isComposite) {
    // broadband / composite
    if (score >= 64) return "임상";
    if (score >= 60) return "준임상";
    return "정상";
  }

  // syndrome scales
  if (score >= 70) return "임상";
  if (score >= 65) return "준임상";
  return "정상";
}