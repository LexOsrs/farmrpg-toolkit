import { Link, useLocation } from 'react-router-dom';
import styles from './Nav.module.css';

const navLinks = [
  { name: 'Apple Pie', to: '/apple-pie' },
  { name: 'Cooking', to: '/cooking' },
  { name: 'Crop Yield', to: '/crop-yield' },
  { name: 'Friendship', to: '/friendship' },
  { name: 'Production', to: '/production' },
  { name: 'Vault', to: '/vault' },
  { name: 'Daily', to: '/daily' },
];

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.mainNav}>
      <div className={styles.pillBar}>
        <Link to="/" className={styles.homeLink} aria-label="Home">
          <img src={import.meta.env.BASE_URL + 'farm_large.png'} alt="" className={styles.farmIcon} />
        </Link>
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
