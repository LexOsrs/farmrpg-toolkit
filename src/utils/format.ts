export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

const suffixes: [number, string][] = [
  [1e33, 'D'],
  [1e30, 'N'],
  [1e27, 'O'],
  [1e24, 'S'],
  [1e21, 's'],
  [1e18, 'Q'],
  [1e15, 'q'],
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

export function formatSilver(n: number): string {
  for (const [threshold, suffix] of suffixes) {
    if (n >= threshold) return (n / threshold).toLocaleString('en-US', { maximumFractionDigits: 3 }) + suffix;
  }
  return n.toLocaleString('en-US');
}

export function formatTimeCompact(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  let out = '';
  if (h) out += h + 'h';
  if (m) out += m + 'm';
  if (s > 0 || out === '') out += s + 's';
  return out;
}

export function formatBreakEvenTime(totalDays: number): string {
  if (totalDays <= 0) return '\u2014';
  const roundedDays = Math.round(totalDays);
  const years = Math.floor(roundedDays / 365);
  const months = Math.floor((roundedDays % 365) / 30);
  const days = roundedDays % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  return parts.join(' ');
}
