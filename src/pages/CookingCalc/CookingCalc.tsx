import { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateCooking, computeTimeline, type CookingInputs } from '../../calculators/cooking';
import { meals, getMealByName } from '../../data/meals';
import { formatNumber, formatTimeCompact } from '../../utils/format';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import ResultRow from '../../components/ResultRow/ResultRow';
import CollapsibleSection from '../../components/CollapsibleSection/CollapsibleSection';
import PerkCheckbox from '../../components/PerkCheckbox/PerkCheckbox';
import InputGroup from '../../components/InputGroup/InputGroup';
import CookingTimeline from './CookingTimeline';
import styles from './CookingCalc.module.css';

const sortedMeals = [...meals].sort((a, b) => a.level - b.level);

const DEFAULT: CookingInputs = {
  mealName: 'Bone Broth',
  batchSize: 1,
  maxOvens: 1,
  eventBonus: 0,
  doStir: true,
  doTaste: true,
  doSeason: true,
  doCollect: true,
  perkAlmanac: false,
  perkAlmanac2: false,
  perkPrimer: false,
  perkPrimer2: false,
  perkHotterOvens: false,
  perkQuicker1: false,
  perkQuicker2: false,
  perkFishChips: false,
};

export default function CookingCalc() {
  const [form, setForm] = useLocalStorage<CookingInputs>('cookingCalcForm', DEFAULT);

  const update = <K extends keyof CookingInputs>(key: K, value: CookingInputs[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateCooking(form), [form]);
  const timeline = useMemo(() => computeTimeline(form), [form]);
  const meal = getMealByName(form.mealName);

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🍲</span>
        <h1>Cooking Calculator</h1>
        <span className={styles.emoji}>🍲</span>
      </div>

      <InfoCard>
        <ul>
          <li><strong>Meals</strong>: Select your meal, the quantity you plan on cooking, and number of ovens.</li>
          <li><strong>Meal Actions</strong>: Toggle which actions to simulate (Stir, Taste, Season, Collect).</li>
          <li><strong>XP Bonuses</strong>: Enable perks, Fish and Chips (20x XP for next 32 actions), and set Event XP Bonus.</li>
          <li><strong>Cooking Speed Perks</strong>: Enable Hotter Ovens and Quicker Cooking perks.</li>
        </ul>
        <p><strong>Notes:</strong><br />
          - Each oven rolls its own RNG; this calculator uses average values for XP.<br />
          - Fish and Chips multiplies XP for the next 32 actions by 20x.<br />
          - Collect XP does not scale with oven count.<br />
          - All calculations are performed locally in your browser.
        </p>
      </InfoCard>

      <Card variant="inputs">
        <h2>Inputs</h2>
        <div className={styles.sectionsColumn}>
          <CollapsibleSection title="Meals">
            <InputGroup label="Meal" htmlFor="meal" style={{ marginBottom: 2 }}>
              <select id="meal" className={styles.mealDropdown} value={form.mealName}
                onChange={e => update('mealName', e.target.value)}>
                {sortedMeals.map(m => {
                  let label = `[${m.level}] ${m.name}`;
                  if (m.seasonal && typeof m.seasonal === 'string') label += ` (${m.seasonal})`;
                  return <option key={m.name} value={m.name}>{label}</option>;
                })}
              </select>
            </InputGroup>
            <InputGroup label="Quantity" htmlFor="batchSize" style={{ marginBottom: 2, maxWidth: 120 }}>
              <input type="number" id="batchSize" min={1} step={1} value={form.batchSize}
                style={{ width: 100 }}
                onChange={e => update('batchSize', parseInt(e.target.value) || 1)} />
            </InputGroup>
            <InputGroup label="Max Ovens" htmlFor="maxOvens" style={{ marginBottom: 2, maxWidth: 120 }}>
              <input type="number" id="maxOvens" min={1} max={10} step={1} value={form.maxOvens}
                style={{ width: 70 }}
                onChange={e => update('maxOvens', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} />
            </InputGroup>
          </CollapsibleSection>

          <CollapsibleSection title="Meal Actions">
            <div style={{ marginBottom: 16 }}>
              <PerkCheckbox id="doStir" label="Stir" hint="(reduces time, XP gain)"
                checked={form.doStir} onChange={v => update('doStir', v)} />
              <PerkCheckbox id="doTaste" label="Taste" hint="(gives mastery, XP)"
                checked={form.doTaste} onChange={v => update('doTaste', v)} />
              <PerkCheckbox id="doSeason" label="Season" hint="(bonus XP)"
                checked={form.doSeason} onChange={v => update('doSeason', v)} />
              <PerkCheckbox id="doCollect" label="Collect" hint="(final XP)"
                checked={form.doCollect} onChange={v => update('doCollect', v)} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="XP Bonuses">
            <PerkCheckbox id="perkAlmanac" label="Cooking Almanac" hint="(+10% XP)"
              checked={form.perkAlmanac} onChange={v => update('perkAlmanac', v)} />
            <PerkCheckbox id="perkAlmanac2" label="Cooking Almanac II" hint="(+10% XP)"
              checked={form.perkAlmanac2} onChange={v => update('perkAlmanac2', v)} />
            <PerkCheckbox id="perkPrimer" label="Cooking Primer" hint="(+10% XP)"
              checked={form.perkPrimer} onChange={v => update('perkPrimer', v)} />
            <PerkCheckbox id="perkPrimer2" label="Cooking Primer II" hint="(+10% XP)"
              checked={form.perkPrimer2} onChange={v => update('perkPrimer2', v)} />
            <PerkCheckbox id="perkFishChips" label="Fish and Chips" hint="(20x XP)"
              checked={form.perkFishChips} onChange={v => update('perkFishChips', v)} />
            <InputGroup label="Event XP Bonus" htmlFor="eventBonus" style={{ maxWidth: 140, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" id="eventBonus" min={0} max={100} step={1} value={form.eventBonus}
                  style={{ width: 60 }}
                  onChange={e => update('eventBonus', parseFloat(e.target.value) || 0)} />
                <span style={{ fontSize: '1.1em', color: '#888' }}>%</span>
              </div>
            </InputGroup>
          </CollapsibleSection>

          <CollapsibleSection title="Cooking Speed Perks">
            <PerkCheckbox id="perkHotterOvens" label="Hotter Ovens I" hint="(10% faster)"
              checked={form.perkHotterOvens} onChange={v => update('perkHotterOvens', v)} />
            <PerkCheckbox id="perkQuicker1" label="Quicker Cooking I" hint="(5% faster)"
              checked={form.perkQuicker1} onChange={v => update('perkQuicker1', v)} />
            <PerkCheckbox id="perkQuicker2" label="Quicker Cooking II" hint="(10% faster)"
              checked={form.perkQuicker2} onChange={v => update('perkQuicker2', v)} />
          </CollapsibleSection>
        </div>
      </Card>

      <Card variant="results">
        <h2>Results</h2>
        <ResultRow label="Total XP:" value={formatNumber(results.totalXP)} />
        <ResultRow label="XP per hour:" value={formatNumber(results.xpPerHour)} />
        <ResultRow label="XP per action:" value={results.xpPerAction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        {form.doStir && results.stirActions > 0 && (
          <ResultRow
            label={<><span style={{ fontWeight: 'bold', color: '#003300' }}>Stir</span> XP:</>}
            value={<>{formatNumber(results.stirXP)} <span style={{ color: '#888' }}>({results.stirActions} action{results.stirActions === 1 ? '' : 's'})</span></>}
          />
        )}
        {form.doTaste && results.tasteActions > 0 && (
          <ResultRow
            label={<><span style={{ fontWeight: 'bold', color: '#00007f' }}>Taste</span> XP:</>}
            value={<>{formatNumber(results.tasteXP)} <span style={{ color: '#888' }}>({results.tasteActions} action{results.tasteActions === 1 ? '' : 's'})</span></>}
          />
        )}
        {form.doSeason && results.seasonActions > 0 && (
          <ResultRow
            label={<><span style={{ fontWeight: 'bold', color: '#4a315c' }}>Season</span> XP:</>}
            value={<>{formatNumber(results.seasonXP)} <span style={{ color: '#888' }}>({results.seasonActions} action{results.seasonActions === 1 ? '' : 's'})</span></>}
          />
        )}
        {results.collectActions > 0 && (
          <ResultRow
            label={<><span style={{ fontWeight: 'bold', color: '#351c04' }}>Collect</span> XP:</>}
            value={<>{formatNumber(results.collectXP)} <span style={{ color: '#888' }}>({results.collectActions} action{results.collectActions === 1 ? '' : 's'})</span></>}
          />
        )}
        <ResultRow label="Action Count:" value={`${results.totalActions} action${results.totalActions === 1 ? '' : 's'}`} />
        <ResultRow label="Total Mastery:" value={formatNumber(results.totalMastery)} />
        <ResultRow label="Total Time:" value={formatTimeCompact(results.finishTime)} />

        {meal && (
          <div style={{ marginTop: 8 }}>
            <h4>Ingredients (x{form.batchSize})</h4>
            {Object.entries(results.ingredients).map(([name, qty]) => (
              <div key={name} className={styles.ingredientRow}>
                <span>{name}</span>
                <span>{formatNumber(qty)}</span>
              </div>
            ))}
          </div>
        )}

        <CookingTimeline steps={timeline} />
      </Card>
    </>
  );
}
