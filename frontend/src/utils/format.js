/**
 * Utility to format numbers and percentages.
 * Rule: Academic percentage should be rounded off to 2 decimal places;
 * if it's a whole number, leave it as it is (no trailing .00).
 */
export function formatScore(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  if (num % 1 === 0) return String(num);
  const fixed = num.toFixed(2);
  const parsed = Number(fixed);
  return parsed % 1 === 0 ? String(parsed) : fixed;
}

export function formatPercent(val) {
  if (val === null || val === undefined || val === '') return '0%';
  return `${formatScore(val)}%`;
}
