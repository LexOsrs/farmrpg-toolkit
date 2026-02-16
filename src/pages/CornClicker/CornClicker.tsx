import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatSilver } from '../../utils/format';
import Card from '../../components/Card/Card';
import styles from './CornClicker.module.css';

type BuyAmount = 1 | 10 | 'max';

interface GameState {
  corn: number;
  totalCorn: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  achievements: string[];
  goldenSeeds: number;
  totalPrestiges: number;
  fields: Record<string, number>;
  pets: Record<string, number>;
  lastTick: number;
}

const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours

const defaultState: GameState = {
  corn: 0,
  totalCorn: 0,
  totalClicks: 0,
  upgrades: {},
  achievements: [],
  goldenSeeds: 0,
  totalPrestiges: 0,
  fields: {},
  pets: {},
  lastTick: 0,
};

function calcGoldenSeeds(totalCorn: number, goldenAcreLevel: number): number {
  const bonus = 1 + ([0, 0.2, 0.5, 1, 2, 4][goldenAcreLevel] ?? 0);
  return Math.floor(Math.sqrt(totalCorn / 100_000) * bonus);
}

function goldenSeedMultiplier(seeds: number): number {
  return 1.2 ** seeds;
}

// --- Upgrades ---

interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  scaling: number;
  perClick?: number;
  perSecond?: number;
  multiplier?: number;
}

const upgrades: UpgradeDef[] = [
  { id: 'basket', name: 'Bigger Basket', desc: '+1 per click', baseCost: 10, scaling: 1.5, perClick: 1 },
  { id: 'scarecrow', name: 'Scarecrow', desc: '+1 per second', baseCost: 50, scaling: 1.6, perSecond: 1 },
  { id: 'fertilizer', name: 'Fertilizer', desc: '+5 per second', baseCost: 300, scaling: 1.7, perSecond: 5 },
  { id: 'tractor', name: 'Tractor', desc: '+25 per second', baseCost: 2_000, scaling: 1.8, perSecond: 25 },
  { id: 'megaseeds', name: 'Mega Seeds', desc: '+100 per second', baseCost: 15_000, scaling: 1.9, perSecond: 100 },
  { id: 'cookieboost', name: 'Cookie Boost', desc: '2x all production', baseCost: 100_000, scaling: 3, multiplier: 2 },
];

// --- Fields ---

interface FieldDef {
  id: string;
  name: string;
  emoji: string;
  desc: (level: number) => string;
  costs: number[];
}

const fieldDefs: FieldDef[] = [
  {
    id: 'meadow', name: 'Sunny Meadow', emoji: '☀️',
    desc: (l) => l === 0 ? 'Passive corn/sec through prestige' : `+${[0, 1, 3, 8, 20, 50][l]}/sec (persists through prestige)`,
    costs: [3, 8, 15, 25, 40],
  },
  {
    id: 'valley', name: 'Fertile Valley', emoji: '🌿',
    desc: (l) => l === 0 ? 'Multiply click power' : `${[0, 1.5, 2, 3, 5, 8][l]}x click power`,
    costs: [3, 8, 15, 25, 40],
  },
  {
    id: 'acre', name: 'Golden Acre', emoji: '✨',
    desc: (l) => l === 0 ? 'Bonus Golden Seeds on prestige' : `+${[0, 20, 50, 100, 200, 400][l]}% seeds on prestige`,
    costs: [5, 12, 20, 35, 50],
  },
  {
    id: 'moon', name: 'Harvest Moon', emoji: '🌙',
    desc: (l) => l === 0 ? 'Reduce upgrade costs' : `-${[0, 10, 20, 30, 40, 50][l]}% upgrade costs`,
    costs: [3, 8, 15, 25, 40],
  },
  {
    id: 'grove', name: 'Enchanted Grove', emoji: '🌳',
    desc: (l) => l === 0 ? 'Auto-clicks per second' : `${[0, 1, 2, 3, 5, 8][l]} auto-clicks/sec`,
    costs: [5, 12, 20, 35, 50],
  },
];

// --- Pets ---

type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface PetDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  bonusDesc: string;
  clickMult: number;
  idleMult: number;
  seedMult: number;
}

const petDefs: PetDef[] = [
  { id: 'chicken', name: 'Chicken', emoji: '🐔', rarity: 'common', bonusDesc: '+5% click/lvl', clickMult: 0.05, idleMult: 0, seedMult: 0 },
  { id: 'cat', name: 'Barn Cat', emoji: '🐱', rarity: 'common', bonusDesc: '+5% idle/lvl', clickMult: 0, idleMult: 0.05, seedMult: 0 },
  { id: 'mouse', name: 'Field Mouse', emoji: '🐭', rarity: 'common', bonusDesc: '+3% all/lvl', clickMult: 0.03, idleMult: 0.03, seedMult: 0 },
  { id: 'dog', name: 'Sheepdog', emoji: '🐕', rarity: 'uncommon', bonusDesc: '+10% idle/lvl', clickMult: 0, idleMult: 0.1, seedMult: 0 },
  { id: 'goat', name: 'Goat', emoji: '🐐', rarity: 'uncommon', bonusDesc: '+10% click/lvl', clickMult: 0.1, idleMult: 0, seedMult: 0 },
  { id: 'pig', name: 'Pig', emoji: '🐷', rarity: 'uncommon', bonusDesc: '+8% seeds/lvl', clickMult: 0, idleMult: 0, seedMult: 0.08 },
  { id: 'cow', name: 'Cow', emoji: '🐄', rarity: 'rare', bonusDesc: '+10% all/lvl', clickMult: 0.1, idleMult: 0.1, seedMult: 0 },
  { id: 'horse', name: 'Horse', emoji: '🐴', rarity: 'rare', bonusDesc: '+15% idle/lvl', clickMult: 0, idleMult: 0.15, seedMult: 0 },
  { id: 'owl', name: 'Owl', emoji: '🦉', rarity: 'rare', bonusDesc: '+15% seeds/lvl', clickMult: 0, idleMult: 0, seedMult: 0.15 },
  { id: 'goose', name: 'Golden Goose', emoji: '🪿', rarity: 'legendary', bonusDesc: '+20% all/lvl', clickMult: 0.2, idleMult: 0.2, seedMult: 0.2 },
];

const rarityWeights: Record<Rarity, number> = { common: 50, uncommon: 30, rare: 15, legendary: 5 };
const rarityColors: Record<Rarity, string> = { common: '#6b7280', uncommon: '#2e7d4f', rare: '#4a7abb', legendary: '#d4a017' };

function rollPet(): PetDef {
  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: Rarity = 'common';
  for (const [rarity, weight] of Object.entries(rarityWeights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) { selectedRarity = rarity; break; }
  }
  const pool = petDefs.filter(p => p.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function getPetBonuses(pets: Record<string, number>) {
  let clickMult = 1;
  let idleMult = 1;
  let seedMult = 1;
  for (const def of petDefs) {
    const level = pets[def.id] ?? 0;
    if (level > 0) {
      clickMult += def.clickMult * level;
      idleMult += def.idleMult * level;
      seedMult += def.seedMult * level;
    }
  }
  return { clickMult, idleMult, seedMult };
}

const meadowPerSec = [0, 1, 3, 8, 20, 50];
const valleyClickMult = [1, 1.5, 2, 3, 5, 8];
const moonCostReduction = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
const groveAutoClicks = [0, 1, 2, 3, 5, 8];

// --- Achievements ---

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  check: (s: GameState) => boolean;
  visible?: (s: GameState) => boolean;
}

const achievements: AchievementDef[] = [
  { id: 'first_corn', name: 'Baby Steps', desc: 'Harvest your first corn', emoji: '🌱', check: s => s.totalCorn >= 1 },
  { id: 'corn_100', name: 'Handful', desc: 'Earn 100 total corn', emoji: '🧺', check: s => s.totalCorn >= 100 },
  { id: 'corn_1k', name: 'Bushel', desc: 'Earn 1,000 total corn', emoji: '🌾', check: s => s.totalCorn >= 1_000 },
  { id: 'corn_10k', name: 'Cornucopia', desc: 'Earn 10,000 total corn', emoji: '🎉', check: s => s.totalCorn >= 10_000 },
  { id: 'corn_100k', name: 'Corn Baron', desc: 'Earn 100,000 total corn', emoji: '🏰', check: s => s.totalCorn >= 100_000 },
  { id: 'corn_1m', name: 'Corn Mogul', desc: 'Earn 1 million total corn', emoji: '💰', check: s => s.totalCorn >= 1_000_000 },
  { id: 'corn_1b', name: 'Corn Tycoon', desc: 'Earn 1 billion total corn', emoji: '👑', check: s => s.totalCorn >= 1_000_000_000 },
  { id: 'clicks_100', name: 'Clicker', desc: 'Click 100 times', emoji: '👆', check: s => s.totalClicks >= 100 },
  { id: 'clicks_1k', name: 'Rapid Fire', desc: 'Click 1,000 times', emoji: '⚡', check: s => s.totalClicks >= 1_000 },
  { id: 'clicks_10k', name: 'Carpal Tunnel', desc: 'Click 10,000 times', emoji: '🦾', check: s => s.totalClicks >= 10_000 },
  { id: 'buy_basket', name: 'Upgrade!', desc: 'Buy your first upgrade', emoji: '🛒', check: s => (s.upgrades['basket'] ?? 0) >= 1 },
  { id: 'buy_scarecrow', name: 'Idle Farmer', desc: 'Buy a Scarecrow', emoji: '🧑‍🌾', check: s => (s.upgrades['scarecrow'] ?? 0) >= 1, visible: s => (s.upgrades['basket'] ?? 0) >= 1 },
  { id: 'buy_tractor', name: 'Mechanized', desc: 'Buy a Tractor', emoji: '🚜', check: s => (s.upgrades['tractor'] ?? 0) >= 1, visible: s => (s.upgrades['fertilizer'] ?? 0) >= 1 },
  { id: 'buy_cookie', name: 'Boosted', desc: 'Buy a Cookie Boost', emoji: '🍪', check: s => (s.upgrades['cookieboost'] ?? 0) >= 1, visible: s => (s.upgrades['megaseeds'] ?? 0) >= 1 },
  { id: 'ten_baskets', name: 'Big Baskets', desc: 'Own 10 Bigger Baskets', emoji: '🧺', check: s => (s.upgrades['basket'] ?? 0) >= 10 },
  { id: 'ten_scarecrows', name: 'Scarecrow Army', desc: 'Own 10 Scarecrows', emoji: '🎃', check: s => (s.upgrades['scarecrow'] ?? 0) >= 10, visible: s => (s.upgrades['basket'] ?? 0) >= 1 },
  { id: 'prestige_1', name: 'Golden Harvest', desc: 'Prestige for the first time', emoji: '🌟', check: s => (s.totalPrestiges ?? 0) >= 1, visible: s => s.totalCorn >= 50_000 },
  { id: 'prestige_5', name: 'Serial Farmer', desc: 'Prestige 5 times', emoji: '✨', check: s => (s.totalPrestiges ?? 0) >= 5, visible: s => (s.totalPrestiges ?? 0) >= 1 },
  { id: 'seeds_10', name: 'Seed Hoarder', desc: 'Accumulate 10 Golden Seeds', emoji: '💫', check: s => (s.goldenSeeds ?? 0) >= 10, visible: s => (s.goldenSeeds ?? 0) >= 1 },
  { id: 'first_field', name: 'Landowner', desc: 'Upgrade a field for the first time', emoji: '🏡', check: s => Object.values(s.fields ?? {}).some(l => l > 0), visible: s => (s.goldenSeeds ?? 0) >= 1 },
  { id: 'max_field', name: 'Field Master', desc: 'Max out a field to level 5', emoji: '🏆', check: s => Object.values(s.fields ?? {}).some(l => l >= 5), visible: s => Object.values(s.fields ?? {}).some(l => l > 0) },
  { id: 'first_pet', name: 'Animal Friend', desc: 'Get your first pet', emoji: '🐾', check: s => Object.values(s.pets ?? {}).some(l => l > 0), visible: s => (s.totalPrestiges ?? 0) >= 1 },
  { id: 'pets_5', name: 'Petting Zoo', desc: 'Collect 5 different pets', emoji: '🐣', check: s => Object.values(s.pets ?? {}).filter(l => l > 0).length >= 5, visible: s => Object.values(s.pets ?? {}).some(l => l > 0) },
  { id: 'pet_legendary', name: 'Lucky Find', desc: 'Get a legendary pet', emoji: '🪿', check: s => petDefs.filter(p => p.rarity === 'legendary').some(p => (s.pets?.[p.id] ?? 0) > 0), visible: s => Object.values(s.pets ?? {}).some(l => l > 0) },
  { id: 'pets_all', name: 'Full Barn', desc: 'Collect all 10 pets', emoji: '🏅', check: s => petDefs.every(p => (s.pets?.[p.id] ?? 0) > 0), visible: s => Object.values(s.pets ?? {}).filter(l => l > 0).length >= 5 },
];

// --- Helpers ---

interface Particle {
  id: number;
  x: number;
  text: string;
}

function getCost(def: UpgradeDef, owned: number, costMult: number): number {
  return Math.floor(def.baseCost * def.scaling ** owned * costMult);
}

function getBulkCost(def: UpgradeDef, owned: number, count: number, costMult: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += getCost(def, owned + i, costMult);
  return total;
}

function getMaxAffordable(def: UpgradeDef, owned: number, budget: number, costMult: number): number {
  let count = 0;
  let total = 0;
  while (true) {
    const next = getCost(def, owned + count, costMult);
    if (total + next > budget) break;
    total += next;
    count++;
  }
  return count;
}

const buyAmounts: BuyAmount[] = [1, 10, 'max'];

let particleId = 0;

type Tab = 'upgrades' | 'achievements' | 'prestige' | 'fields' | 'pets';

export default function CornClicker() {
  const [rawState, setState] = useLocalStorage<GameState>('corn-clicker', defaultState);
  const state: GameState = {
    ...defaultState,
    ...(rawState ?? {}),
    achievements: rawState?.achievements ?? defaultState.achievements,
    fields: rawState?.fields ?? defaultState.fields,
    pets: rawState?.pets ?? defaultState.pets,
  };
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [tab, setTab] = useState<Tab>('upgrades');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firstRender = useRef(true);

  const costMult = moonCostReduction[state.fields['moon'] ?? 0] ?? 1;
  const groveLevel = state.fields['grove'] ?? 0;
  const acreLevel = state.fields['acre'] ?? 0;

  const getClickPower = useCallback((s: GameState) => {
    const vLevel = s.fields?.['valley'] ?? 0;
    const petBonus = getPetBonuses(s.pets ?? {});
    let power = 1;
    for (const u of upgrades) {
      if (u.perClick) power += u.perClick * (s.upgrades[u.id] ?? 0);
    }
    return Math.floor(power * goldenSeedMultiplier(s.goldenSeeds ?? 0) * (valleyClickMult[vLevel] ?? 1) * petBonus.clickMult);
  }, []);

  const getPerSecond = useCallback((s: GameState) => {
    const mLevel = s.fields?.['meadow'] ?? 0;
    const petBonus = getPetBonuses(s.pets ?? {});
    let base = meadowPerSec[mLevel] ?? 0;
    let multiplier = 1;
    for (const u of upgrades) {
      const owned = s.upgrades[u.id] ?? 0;
      if (u.perSecond) base += u.perSecond * owned;
      if (u.multiplier) multiplier *= u.multiplier ** owned;
    }
    return Math.floor(base * multiplier * goldenSeedMultiplier(s.goldenSeeds ?? 0) * petBonus.idleMult);
  }, []);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // Offline progress on mount
  const offlineProcessed = useRef(false);
  useEffect(() => {
    if (offlineProcessed.current) return;
    offlineProcessed.current = true;
    const last = state.lastTick;
    if (last <= 0) {
      // First session — just set the timestamp
      setState(prev => ({ ...prev, lastTick: Date.now() }));
      return;
    }
    const elapsed = Math.min(Math.floor((Date.now() - last) / 1000), MAX_OFFLINE_SECONDS);
    if (elapsed < 5) {
      setState(prev => ({ ...prev, lastTick: Date.now() }));
      return;
    }
    const ps = getPerSecond(state);
    const gLevel = state.fields?.['grove'] ?? 0;
    const autoClicks = groveAutoClicks[gLevel] ?? 0;
    const clickPwr = autoClicks > 0 ? getClickPower(state) * autoClicks : 0;
    const perSec = ps + clickPwr;
    const earned = perSec * elapsed;
    if (earned > 0) {
      setState(prev => ({
        ...prev,
        corn: prev.corn + earned,
        totalCorn: prev.totalCorn + earned,
        totalClicks: prev.totalClicks + autoClicks * elapsed,
        lastTick: Date.now(),
      }));
      const mins = Math.floor(elapsed / 60);
      const timeStr = mins >= 60
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : mins > 0 ? `${mins}m` : `${elapsed}s`;
      showToast(`🌙 Welcome back! Earned ${formatSilver(earned)} corn while away (${timeStr})`);
    } else {
      setState(prev => ({ ...prev, lastTick: Date.now() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check achievements
  useEffect(() => {
    const newlyEarned = achievements.filter(
      a => !state.achievements.includes(a.id) && a.check(state),
    );
    if (newlyEarned.length === 0) return;
    setState(prev => ({
      ...prev,
      achievements: [...(prev.achievements ?? []), ...newlyEarned.map(a => a.id)],
    }));
    if (!firstRender.current) {
      const first = newlyEarned[0];
      if (first) showToast(`${first.emoji} Achievement unlocked: ${first.name}!`);
    }
    firstRender.current = false;
  }, [state.totalCorn, state.totalClicks, state.upgrades, state.achievements, state.fields, state.totalPrestiges, state.goldenSeeds, state.pets, setState, showToast]);

  // Auto-harvest tick
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      const ps = getPerSecond(s) * gameSpeed;
      const gLevel = s.fields?.['grove'] ?? 0;
      const autoClicks = (groveAutoClicks[gLevel] ?? 0) * gameSpeed;
      const clickPwr = autoClicks > 0 ? getClickPower(s) * autoClicks : 0;
      const total = ps + clickPwr;
      if (total > 0) {
        setState(prev => ({
          ...prev,
          corn: prev.corn + total,
          totalCorn: prev.totalCorn + total,
          totalClicks: prev.totalClicks + autoClicks,
          lastTick: Date.now(),
        }));
      } else {
        setState(prev => ({ ...prev, lastTick: Date.now() }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [setState, getPerSecond, getClickPower, gameSpeed]);

  const handleClick = () => {
    const power = getClickPower(state);
    setState(prev => ({
      ...prev,
      corn: prev.corn + power,
      totalCorn: prev.totalCorn + power,
      totalClicks: prev.totalClicks + 1,
    }));

    const id = ++particleId;
    const x = 50 + (Math.random() - 0.5) * 30; // % from left
    setParticles(prev => [...prev.slice(-4), { id, x, text: `+${formatSilver(power)}` }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 800);
  };

  const handleBuy = (def: UpgradeDef) => {
    const owned = state.upgrades[def.id] ?? 0;
    const count = buyAmount === 'max'
      ? getMaxAffordable(def, owned, state.corn, costMult)
      : Math.min(buyAmount, getMaxAffordable(def, owned, state.corn, costMult));
    if (count <= 0) return;
    const cost = getBulkCost(def, owned, count, costMult);
    setState(prev => ({
      ...prev,
      corn: prev.corn - cost,
      upgrades: { ...prev.upgrades, [def.id]: (prev.upgrades[def.id] ?? 0) + count },
    }));
  };

  const handlePrestige = () => {
    const petBonus = getPetBonuses(state.pets ?? {});
    const seedsToEarn = Math.floor(calcGoldenSeeds(state.totalCorn, acreLevel) * petBonus.seedMult);
    if (seedsToEarn <= 0) return;
    const newPet = rollPet();
    if (!window.confirm(
      `Prestige for ${seedsToEarn} Golden Seed${seedsToEarn === 1 ? '' : 's'}? You'll also get a pet! This resets your corn and upgrades.`
    )) return;
    const currentPetLevel = state.pets?.[newPet.id] ?? 0;
    setState(prev => ({
      ...defaultState,
      achievements: prev.achievements ?? [],
      goldenSeeds: (prev.goldenSeeds ?? 0) + seedsToEarn,
      totalPrestiges: (prev.totalPrestiges ?? 0) + 1,
      fields: prev.fields ?? {},
      pets: { ...(prev.pets ?? {}), [newPet.id]: (prev.pets?.[newPet.id] ?? 0) + 1 },
    }));
    firstRender.current = true;
    const levelText = currentPetLevel > 0 ? ` (now lvl ${currentPetLevel + 1})` : '';
    showToast(`🌟 +${seedsToEarn} seeds! ${newPet.emoji} Got ${newPet.name}${levelText}!`);
  };

  const handleFieldUpgrade = (field: FieldDef) => {
    const level = state.fields[field.id] ?? 0;
    if (level >= 5) return;
    const cost = field.costs[level];
    if (cost === undefined || state.goldenSeeds < cost) return;
    setState(prev => ({
      ...prev,
      goldenSeeds: (prev.goldenSeeds ?? 0) - cost,
      fields: { ...(prev.fields ?? {}), [field.id]: (prev.fields?.[field.id] ?? 0) + 1 },
    }));
  };

  const clickPower = getClickPower(state);
  const perSecond = getPerSecond(state);
  const autoClicksPerSec = groveAutoClicks[groveLevel] ?? 0;
  const earnedCount = state.achievements.length;
  const currentSeeds = state.goldenSeeds ?? 0;
  const petBonuses = getPetBonuses(state.pets ?? {});
  const seedsOnPrestige = Math.floor(calcGoldenSeeds(state.totalCorn, acreLevel) * petBonuses.seedMult);
  const currentMultiplier = goldenSeedMultiplier(currentSeeds);
  const nextMultiplier = goldenSeedMultiplier(currentSeeds + seedsOnPrestige);
  const hasAnyPet = Object.values(state.pets).some(l => l > 0);
  const totalPetLevels = Object.values(state.pets).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.page}>
      <div className={styles.title}>Corn Clicker</div>

      <div className={styles.speedBar}>
        <label className={styles.speedLabel}>Speed: {gameSpeed}x</label>
        <input
          type="range"
          min={1}
          max={100}
          value={gameSpeed}
          onChange={e => setGameSpeed(Number(e.target.value))}
          className={styles.speedSlider}
        />
      </div>

      <Card>
        <div className={styles.cornArea}>
          <div className={styles.particleContainer}>
            {particles.map(p => (
              <span key={p.id} className={styles.particle} style={{ left: `${p.x}%` }}>
                {p.text}
              </span>
            ))}
          </div>
          <button className={styles.cornButton} onClick={handleClick} aria-label="Harvest corn">
            🌽
          </button>
          <div className={styles.counter}>{formatSilver(Math.floor(state.corn))} corn</div>
          <div className={styles.perSecond}>
            {formatSilver(clickPower)}/click · {formatSilver(perSecond)}/sec
            {autoClicksPerSec > 0 && ` · ${autoClicksPerSec} auto-clicks/sec`}
          </div>
        </div>
      </Card>

      <Card>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${tab === 'upgrades' ? styles.tabActive : ''}`}
            onClick={() => setTab('upgrades')}
          >
            Upgrades
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'achievements' ? styles.tabActive : ''}`}
            onClick={() => setTab('achievements')}
          >
            Achievements ({earnedCount}/{achievements.length})
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'prestige' ? styles.tabActive : ''}`}
            onClick={() => setTab('prestige')}
          >
            Prestige{currentSeeds > 0 ? ` (${currentSeeds})` : ''}
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'fields' ? styles.tabActive : ''}`}
            onClick={() => setTab('fields')}
          >
            Fields
          </button>
          {hasAnyPet && (
            <button
              className={`${styles.tabBtn} ${tab === 'pets' ? styles.tabActive : ''}`}
              onClick={() => setTab('pets')}
            >
              Pets ({totalPetLevels})
            </button>
          )}
        </div>

        <div className={styles.tabContent}>
        {tab === 'upgrades' && (
          <>
            <div className={styles.buyAmountBar}>
              {buyAmounts.map(amt => (
                <button
                  key={amt}
                  className={`${styles.buyAmountBtn} ${buyAmount === amt ? styles.buyAmountActive : ''}`}
                  onClick={() => setBuyAmount(amt)}
                >
                  {amt === 'max' ? 'Max' : `x${amt}`}
                </button>
              ))}
            </div>
            <div className={styles.upgradeList}>
              {upgrades.map((def, i) => {
                const prev = i > 0 ? upgrades[i - 1] : undefined;
                const prevOwned = prev ? (state.upgrades[prev.id] ?? 0) : 1;
                if (prevOwned === 0) return null;
                const owned = state.upgrades[def.id] ?? 0;
                const count = buyAmount === 'max'
                  ? getMaxAffordable(def, owned, state.corn, costMult)
                  : buyAmount;
                const cost = getBulkCost(def, owned, count, costMult);
                const canAfford = count > 0 && state.corn >= cost;
                return (
                  <div key={def.id} className={styles.upgradeRow}>
                    <div className={styles.upgradeInfo}>
                      <span className={styles.upgradeName}>{def.name}</span>
                      <span className={styles.upgradeDesc}>{def.desc}</span>
                      <span className={styles.upgradeOwned}>
                        Owned: {owned}
                        {owned > 0 && def.perClick && ` · +${formatSilver(def.perClick * owned)}/click`}
                        {owned > 0 && def.perSecond && ` · +${formatSilver(def.perSecond * owned)}/sec`}
                        {owned > 0 && def.multiplier && ` · ${formatSilver(def.multiplier ** owned)}x`}
                      </span>
                    </div>
                    <button
                      className={styles.buyButton}
                      disabled={!canAfford}
                      onClick={() => handleBuy(def)}
                    >
                      {buyAmount === 'max'
                        ? count > 0 ? `${formatSilver(cost)} (x${count})` : 'Max'
                        : count > 1 ? `${formatSilver(cost)} (x${count})` : `${formatSilver(cost)}`
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'achievements' && (
          <div className={styles.achievementList}>
            {achievements.map(a => {
              const earned = state.achievements.includes(a.id);
              const visible = earned || !a.visible || a.visible(state);
              return (
                <div
                  key={a.id}
                  className={`${styles.achievementRow} ${earned ? styles.achievementDone : styles.achievementLocked}`}
                >
                  <span className={styles.achievementEmoji}>{earned ? a.emoji : '🔒'}</span>
                  <div className={styles.achievementText}>
                    <span className={styles.achievementName}>{visible ? a.name : '???'}</span>
                    <span className={styles.achievementDesc}>{visible ? a.desc : '???'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prestige' && (
          <div className={styles.prestigePanel}>
            <div className={styles.prestigeNote}>
              Prestiging resets your corn and upgrades, but earns you Golden Seeds that multiply all production. You'll also receive a random pet each time! Seeds can be spent in the Fields tab on permanent bonuses.
            </div>
            <div className={styles.prestigeDivider} />
            <div className={styles.prestigeInfo}>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Golden Seeds</span>
                <span className={styles.prestigeValue}>🌟 {currentSeeds}</span>
              </div>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Current bonus</span>
                <span className={styles.prestigeValue}>{currentMultiplier.toFixed(1)}x</span>
              </div>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Total corn this run</span>
                <span className={styles.prestigeValue}>{formatSilver(Math.floor(state.totalCorn))}</span>
              </div>
            </div>
            <div className={styles.prestigeDivider} />
            <div className={styles.prestigeInfo}>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Seeds on prestige</span>
                <span className={styles.prestigeValue}>
                  {seedsOnPrestige > 0 ? `+${seedsOnPrestige}` : '0 (need 100K corn)'}
                </span>
              </div>
              {seedsOnPrestige > 0 && (
                <div className={styles.prestigeStat}>
                  <span className={styles.prestigeLabel}>New bonus</span>
                  <span className={styles.prestigeValue}>{nextMultiplier.toFixed(1)}x</span>
                </div>
              )}
            </div>
            <button
              className={styles.prestigeButton}
              disabled={seedsOnPrestige <= 0}
              onClick={handlePrestige}
            >
              {seedsOnPrestige > 0
                ? `Prestige for ${seedsOnPrestige} Golden Seed${seedsOnPrestige === 1 ? '' : 's'}`
                : 'Earn 100K corn to prestige'
              }
            </button>
            <div className={styles.prestigeNote}>
              Resets corn and upgrades. Keeps achievements, seeds, fields, and pets.
            </div>
          </div>
        )}

        {tab === 'fields' && (
          <div className={styles.fieldList}>
            <div className={styles.fieldSeedCount}>🌟 {currentSeeds} Golden Seeds available</div>
            {fieldDefs.map(field => {
              const level = state.fields[field.id] ?? 0;
              const maxed = level >= 5;
              const cost = maxed ? 0 : (field.costs[level] ?? 0);
              const canAfford = !maxed && currentSeeds >= cost;
              return (
                <div key={field.id} className={styles.fieldRow}>
                  <div className={styles.fieldInfo}>
                    <span className={styles.fieldName}>{field.emoji} {field.name}</span>
                    <span className={styles.fieldDesc}>{field.desc(level)}</span>
                    <div className={styles.fieldPips}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <span
                          key={i}
                          className={`${styles.fieldPip} ${i <= level ? styles.fieldPipFilled : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className={styles.fieldBuyBtn}
                    disabled={!canAfford}
                    onClick={() => handleFieldUpgrade(field)}
                  >
                    {maxed ? 'MAX' : `🌟 ${cost}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'pets' && (
          <div className={styles.petList}>
            <div className={styles.prestigeNote}>
              Pets are earned each time you prestige. Duplicates level up, making their bonus stronger. Rarer pets give bigger boosts to clicking, idle production, or Golden Seed earnings.
            </div>
            {petDefs.map(pet => {
              const level = state.pets[pet.id] ?? 0;
              if (level === 0) return (
                <div key={pet.id} className={styles.petRow}>
                  <span className={styles.petEmoji}>❓</span>
                  <div className={styles.petInfo}>
                    <span className={styles.petName} style={{ color: '#aaa' }}>???</span>
                    <span className={styles.petDesc}>???</span>
                  </div>
                </div>
              );
              return (
                <div key={pet.id} className={styles.petRow}>
                  <span className={styles.petEmoji}>{pet.emoji}</span>
                  <div className={styles.petInfo}>
                    <span className={styles.petName}>
                      {pet.name}
                      <span className={styles.petRarity} style={{ color: rarityColors[pet.rarity] }}>
                        {' '}{pet.rarity}
                      </span>
                    </span>
                    <span className={styles.petDesc}>Lvl {level} · {pet.bonusDesc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </Card>

      <button
        className={styles.resetButton}
        onClick={() => {
          if (window.confirm('Reset all Corn Clicker progress? This cannot be undone.')) {
            setState(defaultState);
            firstRender.current = true;
          }
        }}
      >
        Reset all progress
      </button>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
