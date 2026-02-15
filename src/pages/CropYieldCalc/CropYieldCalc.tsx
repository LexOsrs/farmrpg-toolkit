import { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateCropYield, type CropYieldInputs } from '../../calculators/cropYield';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import ResultRow from '../../components/ResultRow/ResultRow';
import RowGroup from '../../components/RowGroup/RowGroup';
import InputGroup from '../../components/InputGroup/InputGroup';
import PerkCheckbox from '../../components/PerkCheckbox/PerkCheckbox';
import styles from './CropYieldCalc.module.css';

const DEFAULT: CropYieldInputs = {
  cropSpaces: 48,
  harvests: 1,
  regularSeeds: 48,
  megaSeeds: 0,
  cookieTypes: 0,
  doublePrizes1: false,
  doublePrizes2: false,
};

export default function CropYieldCalc() {
  const [form, setForm] = useLocalStorage<CropYieldInputs>('cropCalcForm', DEFAULT);

  const update = <K extends keyof CropYieldInputs>(key: K, value: CropYieldInputs[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateCropYield(form), [form]);

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🌽</span>
        <h1>Crop Yield Calculator</h1>
        <span className={styles.emoji}>🌽</span>
      </div>

      <InfoCard>
        <ul>
          <li>Enter the number of <strong>Crop Spaces</strong> you have available for planting.</li>
          <li>Set the number of <strong>Harvests</strong> you want to calculate for.</li>
          <li>Enter how many <strong>Regular Seeds</strong> and <strong>Mega Seeds</strong> you will plant.</li>
          <li>Select how many <strong>Cookie Types</strong> you will eat before harvesting.</li>
          <li>If you have the <strong>Double Prizes I</strong> and/or <strong>Double Prizes II</strong> perks, check the boxes.</li>
        </ul>
        <p>The calculator will show your average crops per harvest and the total for all harvests.</p>
        <p><strong>Tip:</strong> Mega Seeds give 10x yield per seed. Double Prizes perks give a chance for each seed to yield double crops, and cookies multiply your total yield.</p>
      </InfoCard>

      <Card variant="inputs">
        <h2>Inputs</h2>
        <RowGroup>
          <InputGroup label="Crop Spaces" htmlFor="cropSpaces" className={styles.halfWidth}>
            <input type="number" id="cropSpaces" min={1} step={1} value={form.cropSpaces}
              onChange={e => update('cropSpaces', parseInt(e.target.value) || 0)} />
          </InputGroup>
          <InputGroup label="Harvests" htmlFor="harvests" className={styles.halfWidth}>
            <input type="number" id="harvests" min={1} step={1} value={form.harvests}
              onChange={e => update('harvests', parseInt(e.target.value) || 0)} />
          </InputGroup>
        </RowGroup>
        <RowGroup>
          <InputGroup label="Regular Seeds" htmlFor="regularSeeds" className={styles.halfWidth}>
            <input type="number" id="regularSeeds" min={0} step={1} value={form.regularSeeds}
              onChange={e => update('regularSeeds', parseInt(e.target.value) || 0)} />
          </InputGroup>
          <InputGroup label="Mega Seeds" htmlFor="megaSeeds" className={styles.halfWidth}>
            <input type="number" id="megaSeeds" min={0} step={1} value={form.megaSeeds}
              onChange={e => update('megaSeeds', parseInt(e.target.value) || 0)} />
          </InputGroup>
        </RowGroup>
        {results.seedWarning && (
          <div className={styles.seedWarning}>⚠️ {results.seedWarning}</div>
        )}
        <RowGroup>
          <InputGroup label="Number of Cookie Types Eaten" htmlFor="cookieTypes" className={styles.halfWidth}>
            <select id="cookieTypes" className={styles.dropdown} value={form.cookieTypes}
              onChange={e => update('cookieTypes', parseInt(e.target.value))}>
              <option value={0}>0 (No cookies, 1x yield)</option>
              <option value={1}>1 (3x yield)</option>
              <option value={2}>2 (6x yield)</option>
              <option value={3}>3 (9x yield)</option>
            </select>
          </InputGroup>
        </RowGroup>
        <div>
          <div className={styles.perksTitle}>Perks</div>
          <PerkCheckbox id="doublePrizes1" label="Double Prizes I" hint="(15% double)"
            checked={form.doublePrizes1} onChange={v => update('doublePrizes1', v)} />
          <PerkCheckbox id="doublePrizes2" label="Double Prizes II" hint="(25% double)"
            checked={form.doublePrizes2} onChange={v => update('doublePrizes2', v)} />
        </div>
      </Card>

      <Card variant="results">
        <h2>Results</h2>
        <ResultRow label="Average crops per harvest:" value={results.avgPerHarvest.toLocaleString()} />
        <ResultRow label="Average total crops:" value={results.totalCrops.toLocaleString()} />
      </Card>
    </>
  );
}
