import type { ReactNode } from 'react';
import styles from './RowGroup.module.css';

interface RowGroupProps {
  children: ReactNode;
}

export default function RowGroup({ children }: RowGroupProps) {
  return <div className={styles.rowGroup}>{children}</div>;
}
