import { formatTimeCompact } from '../../utils/format';
import type { TimelineStep } from '../../calculators/cooking';
import styles from './CookingCalc.module.css';

const ACTION_COLORS: Record<string, string> = {
  stir: '#003300',
  taste: '#00007f',
  season: '#4a315c',
  collect: '#351c04',
};

interface Props {
  steps: TimelineStep[];
}

export default function CookingTimeline({ steps }: Props) {
  if (steps.length === 0) return null;

  return (
    <div className={styles.timelineBlock}>
      <h4>Timeline</h4>
      <table className={styles.timelineTable}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>XP</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, i) => {
            const color = ACTION_COLORS[step.actionType];
            return (
              <tr key={i}>
                <td>{formatTimeCompact(step.time)}</td>
                <td style={color ? { color, fontWeight: 'bold' } : undefined}>{step.action}</td>
                <td>{step.xpGained > 0 ? Math.round(step.xpGained).toLocaleString() : ''}</td>
                <td>{formatTimeCompact(step.remainingTime)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
