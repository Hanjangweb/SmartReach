import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, PlusCircle, Bell, Bot, Settings,
  ChevronLeft, ChevronRight, Zap, LogOut, ShieldAlert, CreditCard,
  TrendingUp, MessageSquare, Target
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/reminders-manager', icon: Target, label: 'Smart Reminders', premium: true },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics', premium: true },
  { to: '/templates', icon: MessageSquare, label: 'Templates', premium: true },
  { to: '/ai/extract', icon: Bot, label: 'AI Extract' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing' },
];


export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onCloseMobile?.();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SR';

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={20} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="sidebar-logo-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              SmartReach
            </motion.span>
          )}
        </AnimatePresence>
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isPremium = item.premium && (!user?.plan || user.plan === 'free');
          
          if (isPremium) {
            return (
              <div
                key={item.to}
                className="sidebar-item disabled"
                title={collapsed ? item.label : 'Upgrade to Pro to unlock'}
              >
                <span className="sidebar-icon"><item.icon size={20} /></span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      className="sidebar-label-wrapper"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="sidebar-label">{item.label}</span>
                      {item.premium && <span className="premium-badge">✨</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onCloseMobile}
            >
              <span className="sidebar-icon"><item.icon size={20} /></span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    className="sidebar-label-wrapper"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="sidebar-label">{item.label}</span>
                    {item.premium && <span className="premium-badge">✨</span>}
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-item admin-item ${isActive ? 'active' : ''}`}
            title={collapsed ? 'Admin Panel' : undefined}
            onClick={onCloseMobile}
          >
            <span className="sidebar-icon"><ShieldAlert size={20} /></span>
            {!collapsed && <span className="sidebar-label">Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* User + Logout */}
      <div className="sidebar-footer">
        <div className={`sidebar-user ${collapsed ? 'collapsed' : ''}`}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>{initials}</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="sidebar-user-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-plan">{user?.plan || 'Free'} plan</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </motion.aside>
  );
}
