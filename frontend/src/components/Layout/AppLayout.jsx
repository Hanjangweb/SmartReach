import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
