import type { ReactNode } from 'react';
import styles from './InputGroup.module.css';

interface InputGroupProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function InputGroup({ label, htmlFor, hint, children, className, style }: InputGroupProps) {
  return (
    <div className={`${styles.inputGroup} ${className ?? ''}`} style={style}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
