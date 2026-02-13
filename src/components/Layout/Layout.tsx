import { Outlet } from 'react-router-dom';
import Nav from '../Nav/Nav';
import Footer from '../Footer/Footer';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <main className={styles.container}>
      <Nav />
      <Outlet />
      <Footer />
    </main>
  );
}
