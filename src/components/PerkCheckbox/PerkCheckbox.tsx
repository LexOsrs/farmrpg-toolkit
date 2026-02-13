import styles from './PerkCheckbox.module.css';

interface PerkCheckboxProps {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function PerkCheckbox({ id, label, hint, checked, onChange }: PerkCheckboxProps) {
  return (
    <label htmlFor={id} className={styles.perkLabel}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
