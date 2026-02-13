import { useState, type ReactNode } from 'react';
import styles from './CollapsibleSection.module.css';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.collapseBtn}
        aria-expanded={expanded}
        onClick={() => setExpanded(e => !e)}
      >
        {title}
      </button>
      <div className={`${styles.contentWrapper} ${expanded ? styles.contentOpen : ''}`}>
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}
