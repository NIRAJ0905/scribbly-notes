/**
 * Deterministic PRNG + bounded natural handwriting variation.
 * Ensures words look organically written without overlapping adjacent lines.
 */
function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function getWordJitter(word, lineIndex, wordIndex, variationPercent) {
  const intensity = Math.max(0, Math.min(100, variationPercent)) / 100;
  if (intensity === 0) {
    return { dx: 0, dy: 0, rotateDeg: 0, scale: 1 };
  }

  const baseSeed = hashString(`${word}:${lineIndex}:${wordIndex}`);
  const r1 = seededUnit(baseSeed + 1) * 2 - 1; // [-1, 1]
  const r2 = seededUnit(baseSeed + 2) * 2 - 1;
  const r3 = seededUnit(baseSeed + 3) * 2 - 1;
  const r4 = seededUnit(baseSeed + 4) * 2 - 1;

  // Carefully clamped bounds so text remains sharp and lines never collide
  const dx = Number((r1 * 1.1 * intensity).toFixed(2));          // ±1.1px horizontal drift
  const dy = Number((r2 * 1.6 * intensity).toFixed(2));          // ±1.6px baseline bounce
  const rotateDeg = Number((r3 * 1.35 * intensity).toFixed(2));  // ±1.35deg subtle tilt
  const scale = Number((1 + r4 * 0.035 * intensity).toFixed(3)); // ±3.5% size variation

  return { dx, dy, rotateDeg, scale };
}