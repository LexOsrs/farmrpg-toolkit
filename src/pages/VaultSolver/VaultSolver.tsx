import { useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { solveVault, computeFeedback, type VaultGuessEntry, type TileColor, type Feedback } from '../../calculators/vault';
import { formatNumber } from '../../utils/format';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import styles from './VaultSolver.module.css';

function tileClass(color: TileColor): string {
  if (color === 'yellow') return styles.tileYellow ?? '';
  if (color === 'blue') return styles.tileBlue ?? '';
  return styles.tileGray ?? '';
}

function historyTileClass(color: TileColor): string {
  if (color === 'yellow') return styles.historyTileYellow ?? '';
  if (color === 'blue') return styles.historyTileBlue ?? '';
  return styles.historyTileGray ?? '';
}

const NEXT_COLOR: Record<TileColor, TileColor> = {
  gray: 'yellow',
  yellow: 'blue',
  blue: 'gray',
};

const DEFAULT_FEEDBACK: Feedback = ['gray', 'gray', 'gray', 'gray'];

export default function VaultSolver() {
  const [guesses, setGuesses] = useLocalStorage<VaultGuessEntry[]>('vaultSolverGuesses', []);
  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>([...DEFAULT_FEEDBACK] as Feedback);

  const result = useMemo(() => solveVault(guesses), [guesses]);

  const isFullGuess = /^\d{4}$/.test(guessInput);

  const cycleTile = (i: 0 | 1 | 2 | 3) => {
    setFeedback(prev => {
      const next: Feedback = [prev[0], prev[1], prev[2], prev[3]];
      next[i] = NEXT_COLOR[next[i]];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!isFullGuess) return;
    setGuesses(prev => [...prev, { guess: guessInput, feedback }]);
    setGuessInput('');
    setFeedback([...DEFAULT_FEEDBACK] as Feedback);
  };

  const handleUndo = () => {
    setGuesses(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    setGuesses([]);
    setGuessInput('');
    setFeedback([...DEFAULT_FEEDBACK] as Feedback);
  };

  // Check if the current input is a possible code (consistent with all feedback so far)
  const successChance = useMemo(() => {
    if (!isFullGuess || result.solved || result.impossible || result.remainingCount === 0) return null;
    if (guessInput === '0000') return 0;
    for (const { guess, feedback: fb } of guesses) {
      const computed = computeFeedback(guess, guessInput);
      if (computed[0] !== fb[0] || computed[1] !== fb[1] || computed[2] !== fb[2] || computed[3] !== fb[3]) {
        return 0;
      }
    }
    return (1 / result.remainingCount) * 100;
  }, [guessInput, isFullGuess, guesses, result]);

  const digits = guessInput.padEnd(4, ' ').slice(0, 4).split('');

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🔐</span>
        <h1>Vault Solver</h1>
        <span className={styles.emoji}>🔐</span>
      </div>

      <InfoCard>
        <ul>
          <li>Enter the <strong>4-digit code</strong> you guessed in the Vault.</li>
          <li><strong>Click each tile</strong> to match the feedback you received: <strong>Gray</strong> (not in code), <strong>Yellow</strong> (right digit, wrong spot), <strong>Blue</strong> (right digit, right spot).</li>
          <li>The solver will suggest the <strong>best next guess</strong> to narrow down the possibilities.</li>
          <li>Digits can repeat and leading zeros are valid (e.g., 0012).</li>
          <li>Solves in <strong>4.16 guesses</strong> on average, <strong>5 max</strong>. ~76% of codes solved in 4 or fewer.</li>
        </ul>
      </InfoCard>

      <Card variant="inputs">
        {result.solved && (
          <div className={styles.solvedBanner}>
            Solved in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}! The code is {result.suggestedGuess}
          </div>
        )}
        {result.impossible && (
          <div className={styles.errorBanner}>
            No possible codes match the given feedback. Check your entries for errors.
          </div>
        )}
        {!result.solved && !result.impossible && (
          <div className={styles.suggestionBlock}>
            <div className={styles.suggestedRow}>
              <span className={styles.suggestionLabel}>Try guessing</span>
              <span className={styles.suggestedGuess}>{result.suggestedGuess}</span>
              <button
                type="button"
                className={styles.useGuessBtn}
                onClick={() => {
                  setGuessInput(result.suggestedGuess);
                  setFeedback([...DEFAULT_FEEDBACK] as Feedback);
                }}
              >
                Use
              </button>
            </div>
            <div className={styles.suggestionHint}>
              {guesses.length === 0
                ? 'Initial guess'
                : result.remainingCount === 1
                  ? 'Only possible code'
                  : result.suggestedIsCandidate
                    ? 'Could be the code'
                    : 'Elimination guess — narrows down possibilities'}
            </div>
          </div>
        )}

        <div className={styles.inputSection}>
          <input
            type="text"
            id="vaultGuess"
            className={styles.codeInput}
            maxLength={4}
            inputMode="numeric"
            value={guessInput}
            placeholder="0000"
            disabled={result.solved}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setGuessInput(val);
              if (val.length < 4) setFeedback([...DEFAULT_FEEDBACK] as Feedback);
            }}
            onKeyDown={e => { if (e.key === 'Enter' && isFullGuess && !result.solved) handleSubmit(); }}
          />
          {successChance !== null && (
            <div className={successChance > 0 ? (styles.chanceBadge ?? '') : (styles.chanceBadgeZero ?? '')}>
              {successChance > 0
                ? `${successChance < 1 ? '< 1' : Math.round(successChance)}% chance of being correct`
                : 'Already eliminated — won\'t be the code'}
            </div>
          )}

          <div className={styles.tileRow}>
            {([0, 1, 2, 3] as const).map(i => {
              const d = digits[i]!;
              const hasDigit = d >= '0' && d <= '9';
              const colorClass = isFullGuess ? tileClass(feedback[i]) : (styles.tileEmpty ?? '');
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.tile ?? ''} ${colorClass}`}
                  disabled={!isFullGuess || result.solved}
                  onClick={() => cycleTile(i)}
                  aria-label={hasDigit ? `Digit ${d}, ${isFullGuess ? feedback[i] : 'empty'}. Click to change.` : 'Empty'}
                >
                  {hasDigit ? d : ''}
                </button>
              );
            })}
          </div>
          {isFullGuess && !result.solved && (
            <div className={styles.tileHint}>Click tiles to cycle: Gray → Yellow → Blue</div>
          )}

          <div className={styles.buttonRow}>
            <button
              className={styles.submitBtn}
              disabled={!isFullGuess || result.solved}
              onClick={handleSubmit}
            >
              Submit
            </button>
            <button
              className={styles.undoBtn}
              disabled={guesses.length === 0}
              onClick={handleUndo}
            >
              Undo
            </button>
            <button
              className={styles.resetBtn}
              disabled={guesses.length === 0}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className={styles.historyHeader}>
          <h2>Guess History</h2>
          {!result.solved && !result.impossible && (
            <span className={styles.remainingText}>
              {formatNumber(result.remainingCount)} possible codes remaining
            </span>
          )}
        </div>
        {guesses.length === 0 && (
          <div className={styles.historyEmpty}>No guesses yet</div>
        )}
        {guesses.map((g, i) => (
          <div key={i} className={styles.historyRow}>
            <span className={styles.historyNum}>{i + 1}</span>
            <div className={styles.historyTileRow}>
              {([0, 1, 2, 3] as const).map(j => (
                <span
                  key={j}
                  className={`${styles.historyTile ?? ''} ${historyTileClass(g.feedback[j])}`}
                >
                  {g.guess.charAt(j)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
