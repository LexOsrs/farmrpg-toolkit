import { Link, useLocation } from 'react-router-dom';
import styles from './Nav.module.css';

const navLinks = [
  { name: 'Apple Pie Calculator', to: '/apple-pie' },
  { name: 'Cooking Calculator', to: '/cooking' },
  { name: 'Crop Yield Calculator', to: '/crop-yield' },
  { name: 'Friendship Calculator', to: '/friendship' },
  { name: 'Production Planner', to: '/production' },
  { name: 'Vault Solver', to: '/vault' },
];

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.mainNav}>
      <div className={styles.titleRow}>
        <img src={import.meta.env.BASE_URL + 'farm_large.png'} alt="Farm" className={styles.farmIcon} />
        <Link className={styles.titleLink} to="/">FarmRPG Toolkit</Link>
      </div>
      <div className={styles.pillBar}>
        {navLinks.map(link => (
          <Link
            key={link.to}
            className={`${styles.pill} ${pathname === link.to ? styles.pillActive : ''}`}
            to={link.to}
          >
            {link.name}
          </Link>
        ))}
        <Link
          className={`${styles.pill} ${pathname === '/corn' ? styles.pillActive : ''}`}
          to="/corn"
          aria-label="Corn Clicker"
        >
          🌽
        </Link>
      </div>
    </nav>
  );
}
