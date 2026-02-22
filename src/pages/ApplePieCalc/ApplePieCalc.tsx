import { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateApplePie, type ApplePieInputs } from '../../calculators/applePie';
import { formatNumber, formatBreakEvenTime } from '../../utils/format';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import ResultRow from '../../components/ResultRow/ResultRow';
import RowGroup from '../../components/RowGroup/RowGroup';
import InputGroup from '../../components/InputGroup/InputGroup';
import styles from './ApplePieCalc.module.css';

const DEFAULT: ApplePieInputs = {
  numPies: 1,
  exploringLevel: 99,
  currentTower: 50,
  targetTower: 100,
  waitAmount: 1,
  waitUnit: 'days',
};

export default function ApplePieCalc() {
  const [form, setForm] = useLocalStorage<ApplePieInputs>('applePieCalcForm', DEFAULT);

  const update = <K extends keyof ApplePieInputs>(key: K, value: ApplePieInputs[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateApplePie(form), [form]);

  const unitLabel = (unit: string) => {
    const singular = unit.replace(/s$/, '');
    return form.waitAmount === 1 ? singular : unit;
  };

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🥧</span>
        <h1>Should I eat the pie?</h1>
        <span className={styles.emoji}>🥧</span>
      </div>

      <InfoCard>
        <p>This tool helps you decide whether to eat your Apple Pies now or wait until you reach a higher Tower level in FarmRPG.</p>
        <ul>
          <li>Enter how many pies you have, your current and target Tower levels, and how long it will take you to reach your target.</li>
          <li>The calculator will show you how much stamina you lose by waiting, how much extra stamina you would gain per day, and how long it takes to break even.</li>
          <li>For example, if your break-even time is 4 years, then it would take you 4 years of collecting stamina every day to make up for the stamina lost from not eating the pies immediately.</li>
        </ul>
        <p>If you're unsure, use this calculator to compare your options and make the best decision for your play style!</p>
      </InfoCard>

      <Card variant="inputs">
        <h2>Inputs</h2>
        <RowGroup>
          <InputGroup label="Apple Pies" htmlFor="numPies" className={styles.halfWidth}>
            <input type="number" id="numPies" min={1} step={1} value={form.numPies || ''}
              onChange={e => update('numPies', parseInt(e.target.value) || 0)}
              onBlur={() => { if (form.numPies < 1) update('numPies', 1); }} />
          </InputGroup>
          <InputGroup label="Exploring Level" htmlFor="exploringLevel" className={styles.halfWidth}>
            <input type="number" id="exploringLevel" min={0} step={1} value={form.exploringLevel}
              onChange={e => update('exploringLevel', parseInt(e.target.value) || 0)} />
          </InputGroup>
        </RowGroup>
        <RowGroup>
          <InputGroup label="Current Tower Level" htmlFor="currentTower" className={styles.halfWidth}>
            <input type="number" id="currentTower" min={50} max={100} step={1} value={form.currentTower}
              onChange={e => update('currentTower', parseInt(e.target.value) || 0)} />
          </InputGroup>
          <InputGroup label="Target Tower Level" htmlFor="targetTower" className={styles.halfWidth}>
            <input type="number" id="targetTower" min={0} max={300} step={1} value={form.targetTower}
              onChange={e => update('targetTower', parseInt(e.target.value) || 0)} />
          </InputGroup>
        </RowGroup>
        <InputGroup label="How long will it take you to reach your target Tower level?" htmlFor="waitAmount">
          <div className={styles.waitRow}>
            <input type="number" id="waitAmount" min={1} step={1} value={form.waitAmount || ''}
              style={{ width: 70 }}
              onChange={e => update('waitAmount', parseInt(e.target.value) || 0)}
              onBlur={() => { if (form.waitAmount < 1) update('waitAmount', 1); }} />
            <select id="waitUnit" value={form.waitUnit}
              className={styles.waitSelect}
              onChange={e => update('waitUnit', e.target.value as ApplePieInputs['waitUnit'])}>
              <option value="days">{unitLabel('days')}</option>
              <option value="weeks">{unitLabel('weeks')}</option>
              <option value="months">{unitLabel('months')}</option>
            </select>
          </div>
        </InputGroup>
      </Card>

      <Card variant="results">
        {results.exploringWarning && (
          <div className={styles.exploreWarning}>{results.exploringWarning}</div>
        )}
        <h2>Results</h2>
        <ResultRow label="Total stamina lost by waiting:" value={formatNumber(Math.round(results.lostStamina))} variant="loss" />
        <ResultRow label="Extra daily stamina gained by waiting:" value={formatNumber(Math.round(results.extraDaily))} variant="gain" />
        <ResultRow label="Break-even time:" value={formatBreakEvenTime(results.breakEvenDays)} />
      </Card>
    </>
  );
}
