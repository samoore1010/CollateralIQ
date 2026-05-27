import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import Collateral from './pages/Collateral';
import CollateralDetails from './pages/CollateralDetails';
import Marketplace from './pages/Marketplace';
import Filings from './pages/Filings';
import Compliance from './pages/Compliance';
import Disposition from './pages/Disposition';
import Monitoring from './pages/Monitoring';
import Intelligence from './pages/Intelligence';
import Security from './pages/Security';
import BorrowerPortal from './pages/BorrowerPortal';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/portal" element={<BorrowerPortal />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:id" element={<TransactionDetails />} />
            <Route path="collateral" element={<Collateral />} />
            <Route path="collateral/:id" element={<CollateralDetails />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="filings" element={<Filings />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="disposition" element={<Disposition />} />
            <Route path="disposition/:id" element={<Disposition />} />
            <Route path="intelligence" element={<Intelligence />} />
            <Route path="security" element={<Security />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
