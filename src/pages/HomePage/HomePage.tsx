import { Link } from 'react-router-dom';
import Card from '../../components/Card/Card';
import styles from './HomePage.module.css';

const tools = [
  { name: 'Apple Pie Calculator', to: '/apple-pie' },
  { name: 'Crop Yield Calculator', to: '/crop-yield' },
  { name: 'Friendship Calculator', to: '/friendship' },
  { name: 'Cooking Calculator', to: '/cooking' },
  { name: 'Vault Solver', to: '/vault' },
];

export default function HomePage() {
  return (
    <>
      <div className={styles.titleRow}>
        <img src={import.meta.env.BASE_URL + 'farm_large.png'} alt="Farm" className={styles.farmIcon} />
        <h1>FarmRPG Toolkit</h1>
      </div>
      <Card>
        <p>Welcome to the FarmRPG Toolkit! Choose a tool from the navigation.</p>
        <ul className={styles.appList}>
          {tools.map(tool => (
            <li key={tool.to}><Link to={tool.to}>{tool.name}</Link></li>
          ))}
        </ul>
      </Card>
    </>
  );
}
