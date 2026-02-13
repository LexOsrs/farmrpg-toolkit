import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  variant?: 'info' | 'inputs' | 'results';
  children: ReactNode;
}

export default function Card({ variant, children }: CardProps) {
  const classes = [styles.card, variant ? styles[variant] : ''].filter(Boolean).join(' ');
  return <section className={classes}>{children}</section>;
}
