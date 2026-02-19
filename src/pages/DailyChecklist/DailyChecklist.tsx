import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Card from '../../components/Card/Card';
import styles from './DailyChecklist.module.css';

type Category = 'My Farm' | 'Town' | 'Misc';

const allTasks = [
  { id: 'chickens', name: 'Pet chickens', emoji: '🐔', category: 'My Farm' as Category },
  { id: 'cows', name: 'Pet cows', emoji: '🐄', category: 'My Farm' as Category },
  { id: 'pigs', name: 'Feed pigs', emoji: '🐷', category: 'My Farm' as Category },
  { id: 'storehouse', name: 'Work in storehouse', emoji: '🏚️', category: 'My Farm' as Category },
  { id: 'farmhouse', name: 'Rest in farmhouse', emoji: '🏠', category: 'My Farm' as Category },
  { id: 'raptors', name: 'Incubate/pet raptors', emoji: '🦖', category: 'My Farm' as Category },
  { id: 'grapes', name: 'Grape juice crops', emoji: '🍇', category: 'My Farm' as Category },
  { id: 'treasure', name: 'Treasure hut', emoji: '💎', category: 'Town' as Category },
  { id: 'vault', name: 'Crack vault', emoji: '🔐', category: 'Town' as Category },
  { id: 'buddyfarm', name: 'Play Buddyjack', emoji: '🃏', category: 'Town' as Category },
  { id: 'exchange1', name: 'Exchange centre (1/2)', emoji: '🔄', category: 'Town' as Category },
  { id: 'exchange2', name: 'Exchange centre (2/2)', emoji: '🔄', category: 'Town' as Category },
  { id: 'wishingwell', name: 'Wishing well', emoji: '⛲', category: 'Town' as Category },
  { id: 'juices', name: 'Make juices', emoji: '🧃', category: 'Misc' as Category },
  { id: 'helprequests', name: 'Personal help requests', emoji: '🙋', category: 'Misc' as Category },
  { id: 'chores', name: 'Do chores', emoji: '🧹', category: 'Misc' as Category },
] as const;

const allTaskIds = allTasks.map(t => t.id);
const categories: Category[] = ['My Farm', 'Town', 'Misc'];

export default function DailyChecklist() {
  const [checked, setChecked] = useLocalStorage<string[]>('daily-checklist', []);
  const [enabled, setEnabled] = useLocalStorage<string[]>('daily-checklist-enabled', allTaskIds);
  const [disabled, setDisabled] = useLocalStorage<string[]>('daily-checklist-disabled', []);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-enable newly added tasks that aren't explicitly disabled
  const effectiveEnabled = useMemo(() => {
    const newIds = allTaskIds.filter(id => !enabled.includes(id) && !disabled.includes(id));
    if (newIds.length > 0) {
      const merged = [...enabled, ...newIds];
      setEnabled(merged);
      return merged;
    }
    return enabled;
  }, [enabled, disabled, setEnabled]);

  const tasks = useMemo(() => allTasks.filter(t => effectiveEnabled.includes(t.id)), [effectiveEnabled]);
  const checkedCount = useMemo(() => checked.filter(id => effectiveEnabled.includes(id)).length, [checked, effectiveEnabled]);
  const totalCount = tasks.length;
  const allDone = totalCount > 0 && checkedCount === totalCount;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const isChecked = prev.includes(id);
      if (isChecked) return prev.filter(t => t !== id);

      const next = [...prev, id];
      setFlashId(id);
      setTimeout(() => setFlashId(null), 400);

      const nextCheckedCount = next.filter(cid => effectiveEnabled.includes(cid)).length;
      if (nextCheckedCount === effectiveEnabled.length) {
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 1200);
      }
      return next;
    });
  }, [setChecked, effectiveEnabled]);

  const reset = useCallback(() => {
    setChecked([]);
  }, [setChecked]);

  const toggleEnabled = useCallback((id: string) => {
    setEnabled(prev => {
      const turning_off = prev.includes(id);
      if (turning_off) {
        setDisabled(d => d.includes(id) ? d : [...d, id]);
        return prev.filter(t => t !== id);
      } else {
        setDisabled(d => d.filter(t => t !== id));
        return [...prev, id];
      }
    });
  }, [setEnabled, setDisabled]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Daily Checklist</h1>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        <span className={styles.progressLabel}>{checkedCount} / {totalCount} completed</span>
      </div>

      {totalCount > 0 ? categories.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat);
        if (catTasks.length === 0) return null;
        return (
          <Card key={cat}>
            <div className={styles.categoryHeader}>{cat}</div>
            <div className={styles.taskList}>
              {catTasks.map(task => {
                const isChecked = checked.includes(task.id);
                const rowClasses = [
                  styles.taskRow,
                  isChecked ? styles.taskChecked : '',
                  flashId === task.id ? styles.taskFlash : '',
                ].filter(Boolean).join(' ');

                return (
                  <div key={task.id} className={rowClasses} onClick={() => toggle(task.id)}>
                    <span className={styles.taskEmoji}>{task.emoji}</span>
                    <span className={styles.taskName}>{task.name}</span>
                    <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                      <span className={`${styles.checkmark} ${isChecked ? styles.checkmarkVisible : ''}`}>✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      }) : (
        <Card>
          <div className={styles.emptyMessage}>No tasks enabled. Open settings to add some.</div>
        </Card>
      )}

      {allDone && (
        <div className={styles.allDone}>
          <span className={styles.allDoneEmoji}>🌟</span>
          <span className={styles.allDoneText}>All done for today!</span>
        </div>
      )}

      {showBurst && <div className={styles.goldenBurst} />}

      <div className={styles.settingsPanel}>
        <button className={styles.settingsToggle} onClick={() => setSettingsOpen(o => !o)}>
          {settingsOpen ? '▾ Settings' : '▸ Settings'}
        </button>
        {settingsOpen && (
          <div className={styles.settingsList}>
            {categories.map(cat => (
              <div key={cat}>
                <div className={styles.settingsCategoryHeader}>{cat}</div>
                {allTasks.filter(t => t.category === cat).map(task => {
                  const isOn = effectiveEnabled.includes(task.id);
                  return (
                    <label key={task.id} className={styles.settingsRow}>
                      <span className={styles.settingsEmoji}>{task.emoji}</span>
                      <span className={styles.settingsName}>{task.name}</span>
                      <div
                        className={`${styles.toggleTrack} ${isOn ? styles.toggleOn : ''}`}
                        onClick={() => toggleEnabled(task.id)}
                      >
                        <div className={styles.toggleThumb} />
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className={styles.resetButton} onClick={reset}>Reset all</button>
    </div>
  );
}
