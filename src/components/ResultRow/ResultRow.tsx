import type { ReactNode } from 'react';
import styles from './ResultRow.module.css';

interface ResultRowProps {
  label: ReactNode;
  value: ReactNode;
  variant?: 'gain' | 'loss';
}

export default function ResultRow({ label, value, variant }: ResultRowProps) {
  const valueClass = [styles.value, variant ? styles[variant] : ''].filter(Boolean).join(' ');
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
