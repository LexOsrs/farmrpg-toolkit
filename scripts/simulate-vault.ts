import { computeFeedback, pickBestGuess, type Feedback } from '../src/calculators/vault';

// All valid vault codes (0001-9999)
const ALL_CODES: string[] = [];
for (let i = 1; i < 10000; i++) {
  ALL_CODES.push(i.toString().padStart(4, '0'));
}

const SOLVED_KEY = 'blue,blue,blue,blue';
let resolved = 0;

/**
 * Recursively build the game tree. At each node, pick the solver's guess,
 * partition remaining candidates by their feedback, and recurse.
 * Returns a map of guessCount → number of codes solved in that many guesses.
 */
function simulateNode(candidates: string[], depth: number): Map<number, number> {
  if (candidates.length === 0) return new Map();

  const guess = depth === 0 ? '1234' : pickBestGuess(candidates);
  const guessNum = depth + 1;

  if (depth <= 1) {
    process.stderr.write(`\r  Depth ${depth}, evaluating guess ${guess} for ${candidates.length} candidates...    `);
  }

  // Partition candidates by feedback to this guess
  const groups = new Map<string, string[]>();
  for (const code of candidates) {
    const fb = computeFeedback(guess, code);
    const key = fb.join(',');
    let group = groups.get(key);
    if (!group) { group = []; groups.set(key, group); }
    group.push(code);
  }

  const dist = new Map<number, number>();

  for (const [fbKey, codes] of groups) {
    if (fbKey === SOLVED_KEY) {
      // Guess was correct for these codes
      dist.set(guessNum, (dist.get(guessNum) ?? 0) + codes.length);
      resolved += codes.length;
      if (resolved % 200 < codes.length) {
        process.stderr.write(`\r  Resolved: ${resolved} / 9,999 codes    `);
      }
    } else if (depth >= 8) {
      console.error(`\nWarning: exceeded 8 guesses for ${codes.length} codes`);
      dist.set(9, (dist.get(9) ?? 0) + codes.length);
      resolved += codes.length;
    } else {
      const subDist = simulateNode(codes, depth + 1);
      for (const [n, count] of subDist) {
        dist.set(n, (dist.get(n) ?? 0) + count);
      }
    }
  }

  return dist;
}

console.log('Simulating vault solver against all 9,999 codes...');
console.log('First guess: 1234\n');

const startTime = performance.now();
const distribution = simulateNode(ALL_CODES, 0);
const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

process.stderr.write('\r' + ' '.repeat(60) + '\r');

const sorted = [...distribution.entries()].sort((a, b) => a[0] - b[0]);
const total = sorted.reduce((sum, [, count]) => sum + count, 0);

console.log('Results:');
console.log('\u2500'.repeat(42));
let weightedSum = 0;
let maxGuesses = 0;
for (const [guesses, count] of sorted) {
  const pct = ((count / total) * 100).toFixed(1);
  const label = guesses === 1 ? '1 guess:  ' : `${guesses} guesses:`;
  console.log(`  ${label} ${count.toString().padStart(5)} codes  (${pct.padStart(5)}%)`);
  weightedSum += guesses * count;
  if (guesses > maxGuesses) maxGuesses = guesses;
}
console.log('\u2500'.repeat(42));
console.log(`  Average:    ${(weightedSum / total).toFixed(2)} guesses`);
console.log(`  Worst case: ${maxGuesses} guesses`);
console.log(`  Total:      ${total.toLocaleString()} codes`);
console.log(`  Time:       ${elapsed}s`);
