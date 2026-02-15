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
}

const defaultState: GameState = {
  corn: 0,
  totalCorn: 0,
  totalClicks: 0,
  upgrades: {},
  achievements: [],
  goldenSeeds: 0,
  totalPrestiges: 0,
};

function calcGoldenSeeds(totalCorn: number): number {
  return Math.floor(Math.sqrt(totalCorn / 1_000_000));
}

function goldenSeedMultiplier(seeds: number): number {
  return 1 + seeds * 0.1;
}

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
  { id: 'prestige_1', name: 'Golden Harvest', desc: 'Prestige for the first time', emoji: '🌟', check: s => (s.totalPrestiges ?? 0) >= 1, visible: s => s.totalCorn >= 500_000 },
  { id: 'prestige_5', name: 'Serial Farmer', desc: 'Prestige 5 times', emoji: '✨', check: s => (s.totalPrestiges ?? 0) >= 5, visible: s => (s.totalPrestiges ?? 0) >= 1 },
  { id: 'seeds_10', name: 'Seed Hoarder', desc: 'Accumulate 10 Golden Seeds', emoji: '💫', check: s => (s.goldenSeeds ?? 0) >= 10, visible: s => (s.goldenSeeds ?? 0) >= 1 },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
}

function getCost(def: UpgradeDef, owned: number): number {
  return Math.floor(def.baseCost * def.scaling ** owned);
}

function getBulkCost(def: UpgradeDef, owned: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += getCost(def, owned + i);
  return total;
}

function getMaxAffordable(def: UpgradeDef, owned: number, budget: number): number {
  let count = 0;
  let total = 0;
  while (true) {
    const next = getCost(def, owned + count);
    if (total + next > budget) break;
    total += next;
    count++;
  }
  return count;
}

const buyAmounts: BuyAmount[] = [1, 10, 'max'];

let particleId = 0;

export default function CornClicker() {
  const [rawState, setState] = useLocalStorage<GameState>('corn-clicker', defaultState);
  const state: GameState = {
    ...defaultState,
    ...(rawState ?? {}),
    achievements: rawState?.achievements ?? defaultState.achievements,
  };
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [tab, setTab] = useState<'upgrades' | 'achievements' | 'prestige'>('upgrades');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cornAreaRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const getClickPower = useCallback((s: GameState) => {
    let power = 1;
    for (const u of upgrades) {
      if (u.perClick) power += u.perClick * (s.upgrades[u.id] ?? 0);
    }
    return Math.floor(power * goldenSeedMultiplier(s.goldenSeeds ?? 0));
  }, []);

  const getPerSecond = useCallback((s: GameState) => {
    let base = 0;
    let multiplier = 1;
    for (const u of upgrades) {
      const owned = s.upgrades[u.id] ?? 0;
      if (u.perSecond) base += u.perSecond * owned;
      if (u.multiplier) multiplier *= u.multiplier ** owned;
    }
    return Math.floor(base * multiplier * goldenSeedMultiplier(s.goldenSeeds ?? 0));
  }, []);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
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
    // Only toast for achievements earned after first render (not backfill)
    if (!firstRender.current) {
      const first = newlyEarned[0];
      if (first) showToast(`${first.emoji} Achievement unlocked: ${first.name}!`);
    }
    firstRender.current = false;
  }, [state.totalCorn, state.totalClicks, state.upgrades, state.achievements, setState, showToast]);

  useEffect(() => {
    const id = setInterval(() => {
      const ps = getPerSecond(stateRef.current);
      if (ps > 0) {
        setState(prev => ({
          ...prev,
          corn: prev.corn + ps,
          totalCorn: prev.totalCorn + ps,
        }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [setState, getPerSecond]);

  const handleClick = (e: React.MouseEvent) => {
    const power = getClickPower(state);
    setState(prev => ({
      ...prev,
      corn: prev.corn + power,
      totalCorn: prev.totalCorn + power,
      totalClicks: prev.totalClicks + 1,
    }));

    // Spawn particle
    const rect = cornAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left + (Math.random() - 0.5) * 40;
      const y = e.clientY - rect.top - 10;
      const id = ++particleId;
      setParticles(prev => [...prev, { id, x, y, text: `+${formatSilver(power)}` }]);
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 800);
    }
  };

  const handleBuy = (def: UpgradeDef) => {
    const owned = state.upgrades[def.id] ?? 0;
    const count = buyAmount === 'max'
      ? getMaxAffordable(def, owned, state.corn)
      : Math.min(buyAmount, getMaxAffordable(def, owned, state.corn));
    if (count <= 0) return;
    const cost = getBulkCost(def, owned, count);
    setState(prev => ({
      ...prev,
      corn: prev.corn - cost,
      upgrades: { ...prev.upgrades, [def.id]: (prev.upgrades[def.id] ?? 0) + count },
    }));
  };

  const handlePrestige = () => {
    const seedsToEarn = calcGoldenSeeds(state.totalCorn);
    if (seedsToEarn <= 0) return;
    if (!window.confirm(
      `Prestige for ${seedsToEarn} Golden Seed${seedsToEarn === 1 ? '' : 's'}? This resets your corn and upgrades but keeps achievements and seeds.`
    )) return;
    setState(prev => ({
      ...defaultState,
      achievements: prev.achievements ?? [],
      goldenSeeds: (prev.goldenSeeds ?? 0) + seedsToEarn,
      totalPrestiges: (prev.totalPrestiges ?? 0) + 1,
    }));
    firstRender.current = true;
    showToast(`🌟 Prestiged! +${seedsToEarn} Golden Seed${seedsToEarn === 1 ? '' : 's'}`);
  };

  const clickPower = getClickPower(state);
  const perSecond = getPerSecond(state);
  const earnedCount = state.achievements.length;
  const currentSeeds = state.goldenSeeds ?? 0;
  const seedsOnPrestige = calcGoldenSeeds(state.totalCorn);
  const currentMultiplier = goldenSeedMultiplier(currentSeeds);
  const nextMultiplier = goldenSeedMultiplier(currentSeeds + seedsOnPrestige);

  return (
    <div className={styles.page}>
      <div className={styles.title}>Corn Clicker</div>

      <Card>
        <div className={styles.cornArea} ref={cornAreaRef}>
          <div className={styles.particleContainer}>
            {particles.map(p => (
              <span key={p.id} className={styles.particle} style={{ left: p.x, top: p.y }}>
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
                  ? getMaxAffordable(def, owned, state.corn)
                  : buyAmount;
                const cost = getBulkCost(def, owned, count);
                const canAfford = count > 0 && state.corn >= cost;
                return (
                  <div key={def.id} className={styles.upgradeRow}>
                    <div className={styles.upgradeInfo}>
                      <span className={styles.upgradeName}>{def.name}</span>
                      <span className={styles.upgradeDesc}>{def.desc}</span>
                      <span className={styles.upgradeOwned}>Owned: {owned}</span>
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
            <div className={styles.prestigeInfo}>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Golden Seeds</span>
                <span className={styles.prestigeValue}>🌟 {currentSeeds}</span>
              </div>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Current bonus</span>
                <span className={styles.prestigeValue}>{Math.round((currentMultiplier - 1) * 100)}%</span>
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
                  {seedsOnPrestige > 0 ? `+${seedsOnPrestige}` : '0 (need 1M corn)'}
                </span>
              </div>
              {seedsOnPrestige > 0 && (
                <div className={styles.prestigeStat}>
                  <span className={styles.prestigeLabel}>New bonus</span>
                  <span className={styles.prestigeValue}>{Math.round((nextMultiplier - 1) * 100)}%</span>
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
                : 'Earn 1M corn to prestige'
              }
            </button>
            <div className={styles.prestigeNote}>
              Resets corn and upgrades. Keeps achievements and seeds.
            </div>
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
