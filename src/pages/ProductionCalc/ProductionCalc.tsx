import { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { buildings } from '../../data/buildings';
import { upgradeCost, calculateProductionSummary, type ProductLevel } from '../../calculators/production';
import { formatNumber, formatSilver } from '../../utils/format';
import Card from '../../components/Card/Card';
import InfoCard from '../../components/InfoCard/InfoCard';
import CollapsibleSection from '../../components/CollapsibleSection/CollapsibleSection';
import ResultRow from '../../components/ResultRow/ResultRow';
import styles from './ProductionCalc.module.css';

type ProductionLevels = Record<string, ProductLevel>;

function buildDefaultLevels(): ProductionLevels {
  const levels: ProductionLevels = {};
  for (const building of buildings) {
    for (const product of building.products) {
      levels[product.id] = { currentLevel: 0, addLevels: 0 };
    }
  }
  return levels;
}

const DEFAULT_LEVELS = buildDefaultLevels();

export default function ProductionCalc() {
  const [levels, setLevels] = useLocalStorage<ProductionLevels>('productionCalcLevels', DEFAULT_LEVELS);

  const updateLevel = (productId: string, field: 'currentLevel' | 'addLevels', value: number) => {
    setLevels(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? { currentLevel: 0, addLevels: 0 }),
        [field]: Math.max(0, value),
      },
    }));
  };

  const summary = useMemo(() => calculateProductionSummary(levels), [levels]);

  const selectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    input.select();
    // Prevent mouseup from deselecting after click-to-focus
    const onMouseUp = (ev: MouseEvent) => { ev.preventDefault(); };
    input.addEventListener('mouseup', onMouseUp, { once: true });
  };

  return (
    <>
      <div className={styles.titleRow}>
        <span className={styles.emoji}>🏭</span>
        <h1>Production Planner</h1>
        <span className={styles.emoji}>🏭</span>
      </div>

      <InfoCard>
        <ul>
          <li>Set your <strong>current</strong> level and how many levels to <strong>add</strong> for each product.</li>
          <li>Costs are the cumulative silver needed to upgrade those levels.</li>
          <li>The summary shows the grand total across all buildings.</li>
        </ul>
      </InfoCard>

      <Card variant="inputs">
        <h2>Buildings</h2>
        <div className={styles.sectionsColumn}>
          {buildings.map(building => (
            <CollapsibleSection key={building.name} title={building.name}>
              {building.products.map(product => {
                const raw = levels[product.id];
                const level = { currentLevel: raw?.currentLevel ?? 0, addLevels: raw?.addLevels ?? 0 };
                const targetLevel = level.currentLevel + level.addLevels;
                const cost = upgradeCost(product.initialCost, product.costIncrement, level.currentLevel, targetLevel);
                return (
                  <div key={product.id}>
                    <div className={styles.productRow}>
                      <div className={styles.productInfo}>
                        {product.image && (
                          <img src={`${import.meta.env.BASE_URL}images/${product.image}`} alt="" className={styles.productIcon} />
                        )}
                        <div>
                          <div className={styles.productName}>{product.name}</div>
                          <div className={styles.productCycle}>per {product.cyclePer}</div>
                        </div>
                      </div>
                      <div className={styles.levelInputs}>
                        <input
                          type="number"
                          className={styles.levelInput}
                          min={0}
                          value={level.currentLevel}
                          onChange={e => updateLevel(product.id, 'currentLevel', parseInt(e.target.value) || 0)}
                          onFocus={selectAll}
                          aria-label={`${product.name} current level`}
                        />
                        <span className={styles.plus}>+</span>
                        <input
                          type="number"
                          className={styles.levelInput}
                          min={0}
                          value={level.addLevels}
                          onChange={e => updateLevel(product.id, 'addLevels', parseInt(e.target.value) || 0)}
                          onFocus={selectAll}
                          aria-label={`${product.name} levels to add`}
                        />
                        <span className={styles.targetLabel}>= {formatNumber(targetLevel)}</span>
                      </div>
                      <div className={styles.productCost}>
                        {formatSilver(cost)}
                      </div>
                    </div>
                    {product.linkedProducts?.map(lp => {
                      const lpCurrent = Math.floor(level.currentLevel * lp.ratio);
                      const lpTarget = Math.floor(targetLevel * lp.ratio);
                      return (
                        <div key={lp.name} className={`${styles.productRow} ${styles.linkedRow}`}>
                          <div className={styles.productInfo}>
                            {lp.image && (
                              <img src={`${import.meta.env.BASE_URL}images/${lp.image}`} alt="" className={styles.productIcon} />
                            )}
                            <div>
                              <div className={styles.productName}>{lp.name}</div>
                              <div className={styles.productCycle}>{lp.ratio !== 1 ? `+${lp.ratioLabel ?? lp.ratio} per level` : 'per level'}</div>
                            </div>
                          </div>
                          <div className={styles.levelInputs}>
                            <input
                              type="number"
                              className={`${styles.levelInput} ${styles.levelInputDisabled}`}
                              value={lpCurrent}
                              disabled
                            />
                            <span className={styles.plus}>+</span>
                            <input
                              type="number"
                              className={`${styles.levelInput} ${styles.levelInputDisabled}`}
                              value={lpTarget - lpCurrent}
                              disabled
                            />
                            <span className={styles.targetLabel}>= {formatNumber(lpTarget)}</span>
                          </div>
                          <div className={styles.productCost} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CollapsibleSection>
          ))}
        </div>
      </Card>

      <Card variant="results">
        <h2>Summary</h2>
        {summary.buildingCosts.map(bc => bc.total > 0 ? (
          <ResultRow key={bc.buildingName} label={`${bc.buildingName}:`} value={formatSilver(bc.total)} />
        ) : null)}
        <ResultRow label="Grand Total:" value={formatSilver(summary.grandTotal)} />
      </Card>
    </>
  );
}
