import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import AddLead from './pages/AddLead';
import LeadDetail from './pages/LeadDetail';
import Reminders from './pages/Reminders';
import RemindersManager from './pages/RemindersManager';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import AIExtract from './pages/AIExtract';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Pricing from './pages/Pricing';
import Properties from './pages/Properties';
import Deals from './pages/Deals';
import NotificationManager from './components/NotificationManager';


const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  return token && user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <>
      <NotificationManager />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/add" element={<AddLead />} />
          <Route path="leads/edit/:id" element={<AddLead />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="reminders-manager" element={<RemindersManager />} />
          <Route path="properties" element={<Properties />} />
          <Route path="deals" element={<Deals />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="templates" element={<Templates />} />
          <Route path="ai/extract" element={<AIExtract />} />
          <Route path="settings" element={<Settings />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
