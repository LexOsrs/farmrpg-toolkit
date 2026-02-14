export type TileColor = 'gray' | 'yellow' | 'blue';
export type Feedback = [TileColor, TileColor, TileColor, TileColor];

export interface VaultGuessEntry {
  guess: string;
  feedback: Feedback;
}

export interface VaultSolverResult {
  remainingCount: number;
  suggestedGuess: string;
  solved: boolean;
  impossible: boolean;
}

/**
 * Compute per-position feedback matching FarmRPG Vault rules:
 * - Blue: digit is in that exact position
 * - Yellow: digit is in the solution but not that position
 *   (unless it appears only once in solution AND is correctly guessed elsewhere → gray)
 * - Gray: digit is not in the solution, or duplicate-gray rule above
 */
export function computeFeedback(guess: string, secret: string): Feedback {
  const result: TileColor[] = ['gray', 'gray', 'gray', 'gray'];

  for (let i = 0; i < 4; i++) {
    if (guess.charAt(i) === secret.charAt(i)) {
      result[i] = 'blue';
    }
  }

  for (let i = 0; i < 4; i++) {
    if (result[i] === 'blue') continue;
    const digit = guess.charAt(i);

    let countInSecret = 0;
    for (let j = 0; j < 4; j++) {
      if (secret.charAt(j) === digit) countInSecret++;
    }

    if (countInSecret === 0) continue;

    if (countInSecret >= 2) {
      result[i] = 'yellow';
    } else {
      let hasBlue = false;
      for (let j = 0; j < 4; j++) {
        if (result[j] === 'blue' && guess.charAt(j) === digit) {
          hasBlue = true;
          break;
        }
      }
      result[i] = hasBlue ? 'gray' : 'yellow';
    }
  }

  return result as Feedback;
}

// Fast numeric encoding for scoring: gray=0, yellow=1, blue=2
// key = f0*27 + f1*9 + f2*3 + f3  (range 0..80)
function computeFeedbackKey(guess: string, secret: string): number {
  const g0 = guess.charCodeAt(0), g1 = guess.charCodeAt(1);
  const g2 = guess.charCodeAt(2), g3 = guess.charCodeAt(3);
  const s0 = secret.charCodeAt(0), s1 = secret.charCodeAt(1);
  const s2 = secret.charCodeAt(2), s3 = secret.charCodeAt(3);

  const b0 = g0 === s0, b1 = g1 === s1, b2 = g2 === s2, b3 = g3 === s3;

  let f0 = 0, f1 = 0, f2 = 0, f3 = 0;
  if (b0) f0 = 2;
  if (b1) f1 = 2;
  if (b2) f2 = 2;
  if (b3) f3 = 2;

  if (!b0) {
    const cnt = (s0 === g0 ? 1 : 0) + (s1 === g0 ? 1 : 0) + (s2 === g0 ? 1 : 0) + (s3 === g0 ? 1 : 0);
    if (cnt >= 2) f0 = 1;
    else if (cnt === 1 && !((b1 && g1 === g0) || (b2 && g2 === g0) || (b3 && g3 === g0))) f0 = 1;
  }
  if (!b1) {
    const cnt = (s0 === g1 ? 1 : 0) + (s1 === g1 ? 1 : 0) + (s2 === g1 ? 1 : 0) + (s3 === g1 ? 1 : 0);
    if (cnt >= 2) f1 = 1;
    else if (cnt === 1 && !((b0 && g0 === g1) || (b2 && g2 === g1) || (b3 && g3 === g1))) f1 = 1;
  }
  if (!b2) {
    const cnt = (s0 === g2 ? 1 : 0) + (s1 === g2 ? 1 : 0) + (s2 === g2 ? 1 : 0) + (s3 === g2 ? 1 : 0);
    if (cnt >= 2) f2 = 1;
    else if (cnt === 1 && !((b0 && g0 === g2) || (b1 && g1 === g2) || (b3 && g3 === g2))) f2 = 1;
  }
  if (!b3) {
    const cnt = (s0 === g3 ? 1 : 0) + (s1 === g3 ? 1 : 0) + (s2 === g3 ? 1 : 0) + (s3 === g3 ? 1 : 0);
    if (cnt >= 2) f3 = 1;
    else if (cnt === 1 && !((b0 && g0 === g3) || (b1 && g1 === g3) || (b2 && g2 === g3))) f3 = 1;
  }

  return f0 * 27 + f1 * 9 + f2 * 3 + f3;
}

function feedbackToKey(fb: Feedback): number {
  const v = (c: TileColor) => c === 'blue' ? 2 : c === 'yellow' ? 1 : 0;
  return v(fb[0]) * 27 + v(fb[1]) * 9 + v(fb[2]) * 3 + v(fb[3]);
}

function generateAllCodes(): string[] {
  const codes: string[] = [];
  for (let i = 1; i < 10000; i++) {
    codes.push(i.toString().padStart(4, '0'));
  }
  return codes;
}

const ALL_CODES = generateAllCodes();

export function filterCandidates(
  candidates: string[],
  guess: string,
  feedback: Feedback,
): string[] {
  const targetKey = feedbackToKey(feedback);
  return candidates.filter(code => computeFeedbackKey(guess, code) === targetKey);
}

export function pickBestGuess(candidates: string[]): string {
  if (candidates.length <= 2) return candidates[0]!;

  const candidateSet = new Set(candidates);
  let bestGuess = candidates[0]!;
  let bestEntropy = Infinity;
  let bestMaxBucket = Infinity;
  let bestIsCandidate = false;

  // Search ALL codes (not just candidates) to find information-maximizing guesses.
  const buckets = new Int32Array(81);

  for (const guess of ALL_CODES) {
    buckets.fill(0);
    for (const code of candidates) {
      const key = computeFeedbackKey(guess, code);
      buckets[key] = buckets[key]! + 1;
    }

    // Entropy: maximize -sum(p * log(p)), equiv. to minimize sum(b * log(b))
    let entropySum = 0;
    let maxBucket = 0;
    for (let k = 0; k < 81; k++) {
      const b = buckets[k]!;
      if (b > 0) entropySum += b * Math.log(b);
      if (b > maxBucket) maxBucket = b;
    }

    if (entropySum > bestEntropy) continue;

    const isCandidate = candidateSet.has(guess);

    // Rank: 1) higher entropy (lower sum), 2) lower max bucket, 3) prefer candidates
    if (
      entropySum < bestEntropy ||
      (entropySum === bestEntropy && maxBucket < bestMaxBucket) ||
      (entropySum === bestEntropy && maxBucket === bestMaxBucket && isCandidate && !bestIsCandidate)
    ) {
      bestEntropy = entropySum;
      bestMaxBucket = maxBucket;
      bestGuess = guess;
      bestIsCandidate = isCandidate;
    }
  }

  return bestGuess;
}

export function solveVault(guesses: VaultGuessEntry[]): VaultSolverResult {
  if (guesses.length === 0) {
    return {
      remainingCount: 9999,
      suggestedGuess: '0123',
      solved: false,
      impossible: false,
    };
  }

  let candidates: string[] = ALL_CODES;
  for (const { guess, feedback } of guesses) {
    candidates = filterCandidates(candidates, guess, feedback);
  }

  const lastGuess = guesses[guesses.length - 1]!;
  if (lastGuess.feedback.every(c => c === 'blue')) {
    return {
      remainingCount: candidates.length,
      suggestedGuess: lastGuess.guess,
      solved: true,
      impossible: false,
    };
  }

  if (candidates.length === 0) {
    return {
      remainingCount: 0,
      suggestedGuess: '',
      solved: false,
      impossible: true,
    };
  }

  if (candidates.length === 1) {
    return {
      remainingCount: 1,
      suggestedGuess: candidates[0]!,
      solved: false,
      impossible: false,
    };
  }

  const suggested = pickBestGuess(candidates);
  return {
    remainingCount: candidates.length,
    suggestedGuess: suggested,
    solved: false,
    impossible: false,
  };
}
