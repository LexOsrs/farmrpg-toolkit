import { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateFriendship, type FriendshipInputs, type GiftType } from '../../calculators/friendship';
import { formatNumber } from '../../utils/format';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import ResultRow from '../../components/ResultRow/ResultRow';
import RowGroup from '../../components/RowGroup/RowGroup';
import InputGroup from '../../components/InputGroup/InputGroup';
import PerkCheckbox from '../../components/PerkCheckbox/PerkCheckbox';
import styles from './FriendshipCalc.module.css';

const DEFAULT: FriendshipInputs = {
  giftType: 'loved',
  giftCount: 1,
  currentLevel: 1.0,
  totd: false,
  meal: false,
  primer: false,
  omg1: false,
  omg2: false,
};

const GIFT_OPTIONS: { value: GiftType; label: string }[] = [
  { value: 'loved', label: 'Loved (+150 XP)' },
  { value: 'liked', label: 'Liked (+25 XP)' },
  { value: 'other', label: 'Other (+1 XP)' },
  { value: 'heart', label: 'Heart Container (+10,000,000 XP)' },
  { value: 'bouquet', label: 'Bouquet of Flowers (+1,000 XP)' },
  { value: 'prism', label: 'Prism Shell (+100,000,000 XP) (Geist only)' },
  { value: 'mask', label: "Ramjoram's Mask (+100,000,000 XP) (Star Meerif only)" },
  { value: 'corn', label: 'Refined Corn Quartz (+100,000,000 XP) (ROOMBA & Jill only)' },
  { value: 'mace', label: 'Five Point Mace (+100,000,000 XP) (Ric Ryph only)' },
  { value: 'palette', label: 'Perfect Paint Palette (+100,000,000 XP) (George only)' },
  { value: 'garebear', label: 'Gare Bear (+100,000,000 XP) (Gary Bearson V. only)' },
];

export default function FriendshipCalc() {
  const [form, setForm] = useLocalStorage<FriendshipInputs>('friendshipCalcForm', DEFAULT);

  const update = <K extends keyof FriendshipInputs>(key: K, value: FriendshipInputs[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateFriendship(form), [form]);

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🤝</span>
        <h1>Friendship Calculator</h1>
        <span className={styles.emoji}>🤝</span>
      </div>

      <InfoCard>
        <ul>
          <li>Enter your <strong>current friendship level</strong> with the Townsfolk.</li>
          <li>Enter the number and type of items you plan to gift.</li>
          <li>Select any relevant bonuses or perks.</li>
          <li>The calculator will show the total friendship XP gained and your new level after gifting.</li>
        </ul>
        <p><strong>XP per gift:</strong> Loved: 150 XP, Liked: 25 XP, Other: 1 XP. All bonuses stack multiplicatively. O.M.G. perks apply a chance for a 7-10x XP bonus per give action. Special items give large, fixed amounts of XP.</p>
      </InfoCard>

      <Card variant="inputs">
        <h2>Inputs</h2>
        <RowGroup>
          <InputGroup label="Quantity" htmlFor="giftCount" style={{ maxWidth: 110 }}>
            <input type="number" id="giftCount" min={1} step={1} value={form.giftCount || ''}
              style={{ width: 100 }}
              onChange={e => update('giftCount', parseInt(e.target.value) || 0)}
              onBlur={() => { if (form.giftCount < 1) update('giftCount', 1); }} />
          </InputGroup>
          <InputGroup label="Gift Type" htmlFor="giftType" className={styles.halfWidth}>
            <select id="giftType" className={styles.dropdown} value={form.giftType}
              onChange={e => update('giftType', e.target.value as GiftType)}>
              {GIFT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </InputGroup>
        </RowGroup>
        <RowGroup>
          <InputGroup label="Current Level" htmlFor="currentLevel" className={styles.halfWidth}>
            <div className={styles.levelRow}>
              <input type="number" id="currentLevel" min={1} max={99} step={0.1} value={form.currentLevel || ''}
                style={{ width: 90 }}
                onChange={e => update('currentLevel', parseFloat(e.target.value) || 0)}
                onBlur={() => { if (form.currentLevel < 1) update('currentLevel', 1); }} />
              <span className={styles.xpEstimate}>XP (estimated): {formatNumber(Math.round(results.currentXP))}</span>
            </div>
          </InputGroup>
        </RowGroup>
        <div>
          <div className={styles.bonusTitle}>Bonuses</div>
          <PerkCheckbox id="totd" label="Townsfolk of the Day" hint="(2x XP)"
            checked={form.totd} onChange={v => update('totd', v)} />
          <PerkCheckbox id="meal" label="Over The Moon" hint="(10% XP, meal)"
            checked={form.meal} onChange={v => update('meal', v)} />
          <PerkCheckbox id="primer" label="Friendship Primer" hint="(10% XP, perk)"
            checked={form.primer} onChange={v => update('primer', v)} />
          <PerkCheckbox id="omg1" label="O.M.G I" hint="(5% chance for 7-10x XP, perk)"
            checked={form.omg1} onChange={v => update('omg1', v)} />
          <PerkCheckbox id="omg2" label="O.M.G II" hint="(5% chance for 7-10x XP, perk)"
            checked={form.omg2} onChange={v => update('omg2', v)} />
        </div>
      </Card>

      <Card variant="results">
        <h2>Results</h2>
        <h3>Normal</h3>
        <ResultRow label="XP Gained:" value={formatNumber(Math.round(results.gainedXP))} />
        <ResultRow label="New Total XP:" value={formatNumber(Math.round(results.newXP))} />
        <ResultRow label="New Level:" value={results.newLevel.toFixed(2)} />
        {results.omg && (
          <>
            <h3>If O.M.G triggers</h3>
            <ResultRow label="XP Gained:" value={`${formatNumber(results.omg.minXP)} to ${formatNumber(results.omg.maxXP)}`} />
            <ResultRow label="New Total XP:" value={`${formatNumber(Math.round(results.omg.minNewXP))} to ${formatNumber(Math.round(results.omg.maxNewXP))}`} />
            <ResultRow label="New Level:" value={`${results.omg.minLevel.toFixed(2)} to ${results.omg.maxLevel.toFixed(2)}`} />
          </>
        )}
      </Card>
    </>
  );
}
