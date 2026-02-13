import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Nav.module.css';

const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'Apple Pie Calculator', to: '/apple-pie' },
  { name: 'Crop Yield Calculator', to: '/crop-yield' },
  { name: 'Friendship Calculator', to: '/friendship' },
  { name: 'Cooking Calculator', to: '/cooking' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className={styles.mainNav}>
      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <img src={import.meta.env.BASE_URL + 'farm_large.png'} alt="Farm" className={styles.farmIcon} />
          <Link className={styles.titleLink} to="/">FarmRPG Toolkit</Link>
        </div>
        <button
          className={styles.toggle}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect y="7" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
            <rect y="14" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
            <rect y="21" width="32" height="3.5" rx="2" fill="#2e7d4f"/>
          </svg>
        </button>
      </div>
      <div className={`${styles.overlay} ${!open ? styles.overlayHidden : ''}`}>
        <button className={styles.closeBtn} aria-label="Close menu" onClick={() => setOpen(false)}>
          &times;
        </button>
        {navLinks.map(link => (
          <Link key={link.to} className={styles.overlayLink} to={link.to} onClick={() => setOpen(false)}>
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
