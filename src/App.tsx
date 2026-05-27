import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import Collateral from './pages/Collateral';
import Marketplace from './pages/Marketplace';

import CollateralDetails from './pages/CollateralDetails';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<TransactionDetails />} />
          <Route path="collateral" element={<Collateral />} />
          <Route path="collateral/:id" element={<CollateralDetails />} />
          <Route path="marketplace" element={<Marketplace />} />
        </Route>
      </Routes>
    </Router>
  );
}
