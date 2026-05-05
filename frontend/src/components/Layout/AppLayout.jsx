import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SupportChatWidget from '../SupportChatWidget';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout" style={{ overflowX: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={isMobile ? { marginLeft: 0 } : {}}
      >
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <SupportChatWidget />
    </div>
  );
}
