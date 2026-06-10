import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { LangProvider, useLang } from './context/LangContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sellers from './pages/Sellers';
import Charities from './pages/Charities';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const SIDEBAR_FULL = 240;
const SIDEBAR_ICON = 64;

function PrivateLayout() {
  const { lang } = useLang();
  if (!localStorage.getItem('adminToken')) return <Navigate to="/login" replace />;

  const isRtl = lang === 'ar';
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const sidebarW = collapsed ? SIDEBAR_ICON : SIDEBAR_FULL;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div style={{
        flex: 1,
        marginRight: isRtl ? sidebarW : 0,
        marginLeft:  isRtl ? 0 : sidebarW,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        maxWidth: `calc(100vw - ${sidebarW}px)`,
        transition: 'margin .2s ease, max-width .2s ease',
      }}>
        <Topbar />
        <main style={{ flex: 1, padding: '24px 28px', overflowX: 'hidden' }} className="page-in">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/sellers"   element={<Sellers />} />
            <Route path="/charities" element={<Charities />} />
            <Route path="/users"     element={<Users />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*"     element={<PrivateLayout />} />
          </Routes>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
