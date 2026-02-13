import { useState, type ReactNode } from 'react';
import styles from './InfoCard.module.css';

interface InfoCardProps {
  title?: string;
  children: ReactNode;
}

export default function InfoCard({ title = 'How does this calculator work?', children }: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.infoCard}>
      <button
        className={styles.expandBtn}
        aria-expanded={expanded}
        onClick={() => setExpanded(e => !e)}
        type="button"
      >
        <span className={styles.label}>{title}</span>
        <span className={styles.arrow}>{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      <div className={`${styles.contentWrapper} ${expanded ? styles.contentOpen : ''}`}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
