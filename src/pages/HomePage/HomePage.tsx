import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const tools = [
  { name: 'Apple Pie Calculator', to: '/apple-pie', emoji: '🥧', desc: 'Work out apple pie profits and break-even points.' },
  { name: 'Cooking Calculator', to: '/cooking', emoji: '🍲', desc: 'XP, timing, and ingredient costs for cooking meals.' },
  { name: 'Crop Yield Calculator', to: '/crop-yield', emoji: '🌾', desc: 'Expected harvests, seeds, and stamina usage.' },
  { name: 'Friendship Calculator', to: '/friendship', emoji: '💚', desc: 'Gifts and XP needed to reach friendship levels.' },
  { name: 'Production Planner', to: '/production', emoji: '🏭', desc: 'Plan building upgrades and see total silver costs.' },
  { name: 'Vault Solver', to: '/vault', emoji: '🔐', desc: 'Optimal guesses to crack the vault in 5 or fewer tries.' },
];

export default function HomePage() {
  return (
    <div className={styles.grid}>
      {tools.map(tool => (
        <Link key={tool.to} className={styles.toolCard} to={tool.to}>
          <span className={styles.toolEmoji}>{tool.emoji}</span>
          <div className={styles.toolText}>
            <span className={styles.toolName}>{tool.name}</span>
            <span className={styles.toolDesc}>{tool.desc}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
