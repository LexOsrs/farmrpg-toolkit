import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage/HomePage';
import ApplePieCalc from './pages/ApplePieCalc/ApplePieCalc';
import CropYieldCalc from './pages/CropYieldCalc/CropYieldCalc';
import FriendshipCalc from './pages/FriendshipCalc/FriendshipCalc';
import CookingCalc from './pages/CookingCalc/CookingCalc';
import VaultSolver from './pages/VaultSolver/VaultSolver';
import ProductionCalc from './pages/ProductionCalc/ProductionCalc';
import CornClicker from './pages/CornClicker/CornClicker';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="apple-pie" element={<ApplePieCalc />} />
        <Route path="crop-yield" element={<CropYieldCalc />} />
        <Route path="friendship" element={<FriendshipCalc />} />
        <Route path="cooking" element={<CookingCalc />} />
        <Route path="vault" element={<VaultSolver />} />
        <Route path="production" element={<ProductionCalc />} />
        <Route path="corn" element={<CornClicker />} />
      </Route>
    </Routes>
  );
}
