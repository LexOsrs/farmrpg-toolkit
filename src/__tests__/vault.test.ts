import { describe, it, expect } from 'vitest';
import { computeFeedback, filterCandidates, solveVault } from '../calculators/vault';

describe('computeFeedback', () => {
  it('returns all blue for exact match', () => {
    expect(computeFeedback('1234', '1234')).toEqual(['blue', 'blue', 'blue', 'blue']);
  });

  it('returns all gray for no match', () => {
    expect(computeFeedback('1234', '5678')).toEqual(['gray', 'gray', 'gray', 'gray']);
  });

  it('returns mixed feedback', () => {
    // Target 1325: 1 correct, 2 and 3 swapped, 4 not in target
    expect(computeFeedback('1234', '1325')).toEqual(['blue', 'yellow', 'yellow', 'gray']);
  });

  it('handles all swapped digits', () => {
    expect(computeFeedback('1122', '2211')).toEqual(['yellow', 'yellow', 'yellow', 'yellow']);
  });

  it('handles single digit guess with one match', () => {
    // 1 appears once in target at pos 0; pos 0 is blue, rest are gray
    expect(computeFeedback('1111', '1222')).toEqual(['blue', 'gray', 'gray', 'gray']);
  });

  // FarmRPG-specific duplicate rules from user examples
  it('target 1123, guess 1111: 1 appears 2+ times, extras are yellow', () => {
    expect(computeFeedback('1111', '1123')).toEqual(['blue', 'blue', 'yellow', 'yellow']);
  });

  it('target 1123, guess 3330: 3 once in target, no blue, all yellow', () => {
    expect(computeFeedback('3330', '1123')).toEqual(['yellow', 'yellow', 'yellow', 'gray']);
  });

  it('target 1123, guess 3003: 3 once in target with blue, others gray', () => {
    expect(computeFeedback('3003', '1123')).toEqual(['gray', 'gray', 'gray', 'blue']);
  });

  it('target 1123, guess 3333: same as above', () => {
    expect(computeFeedback('3333', '1123')).toEqual(['gray', 'gray', 'gray', 'blue']);
  });

  it('target 0300, guess 0033: duplicate yellows with single occurrence', () => {
    // 3 appears once in target at pos 1, not guessed correctly → both 3s yellow
    expect(computeFeedback('0033', '0300')).toEqual(['blue', 'yellow', 'yellow', 'yellow']);
  });

  it('9999 with target having 9 at pos 0 and 2', () => {
    expect(computeFeedback('9999', '9090')).toEqual(['blue', 'yellow', 'blue', 'yellow']);
  });
});

describe('filterCandidates', () => {
  const allCodes: string[] = [];
  for (let i = 1; i < 10000; i++) allCodes.push(i.toString().padStart(4, '0'));

  it('filters to 1295 when all gray on 1234', () => {
    const result = filterCandidates(allCodes, '1234', ['gray', 'gray', 'gray', 'gray']);
    // No digits 1,2,3,4 in solution → 6^4 - 1 (excluding 0000) = 1295
    expect(result.length).toBe(1295);
  });

  it('filters to 1 when all blue', () => {
    const result = filterCandidates(allCodes, '5678', ['blue', 'blue', 'blue', 'blue']);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('5678');
  });

  it('narrows candidates progressively', () => {
    const after1 = filterCandidates(allCodes, '1234', ['gray', 'yellow', 'gray', 'gray']);
    const after2 = filterCandidates(after1, '5678', ['gray', 'gray', 'gray', 'gray']);
    expect(after2.length).toBeLessThan(after1.length);
    expect(after2.length).toBeGreaterThan(0);
  });
});

describe('solveVault', () => {
  it('returns suggestion for empty history', () => {
    const result = solveVault([]);
    expect(result.remainingCount).toBe(9999);
    expect(result.suggestedGuess).toBe('0123');
    expect(result.solved).toBe(false);
    expect(result.impossible).toBe(false);
  });

  it('returns solved when all blue', () => {
    const result = solveVault([{ guess: '5678', feedback: ['blue', 'blue', 'blue', 'blue'] }]);
    expect(result.solved).toBe(true);
    expect(result.suggestedGuess).toBe('5678');
  });

  it('returns impossible for contradictory feedback', () => {
    const result = solveVault([
      { guess: '1234', feedback: ['blue', 'blue', 'blue', 'blue'] },
      { guess: '1234', feedback: ['gray', 'gray', 'gray', 'gray'] },
    ]);
    expect(result.impossible).toBe(true);
    expect(result.remainingCount).toBe(0);
  });

  it('narrows down after a guess', () => {
    const result = solveVault([{ guess: '1234', feedback: ['gray', 'gray', 'gray', 'gray'] }]);
    expect(result.remainingCount).toBe(1295);
    expect(result.solved).toBe(false);
    expect(result.impossible).toBe(false);
    expect(result.suggestedGuess).toBeTruthy();
  });

  it('suggests information-maximizing guess, not a safe candidate', () => {
    // After 1234 → gray/blue/blue/blue, positions 1-3 are known (234)
    // Only position 0 is unknown (9 possibilities: 0,2,3,4,5,6,7,8,9)
    // Solver should NOT suggest ?234 which wastes 3 positions on known info
    const result = solveVault([{ guess: '1234', feedback: ['gray', 'blue', 'blue', 'blue'] }]);
    expect(result.remainingCount).toBe(9);
    expect(result.suggestedGuess.slice(1)).not.toBe('234');
  });

  it('narrows candidates with information-maximizing guess', () => {
    // After 1234 (gray/blue/blue/blue) + 0567 (all gray):
    // Only 5 candidates remain: ?234 where ? is in {2,3,4,8,9} minus 2
    // Solver should suggest a guess that can distinguish between them
    const result = solveVault([
      { guess: '1234', feedback: ['gray', 'blue', 'blue', 'blue'] },
      { guess: '0567', feedback: ['gray', 'gray', 'gray', 'gray'] },
    ]);
    expect(result.remainingCount).toBe(5);
    expect(result.suggestedGuess).toBeTruthy();
  });
});
