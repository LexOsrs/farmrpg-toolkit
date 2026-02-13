import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <small>All calculations are performed locally in your browser.<br />
      <span className={styles.disclaimer}>FarmRPG Toolkit is an independent fan project and is not affiliated with FarmRPG or its creators.</span></small>
    </footer>
  );
}
