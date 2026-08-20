import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/questions', icon: '📝', label: 'Questions' },
  { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { to: '/assignments', icon: '📋', label: 'Assignments' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: '⚙️', label: 'Admin Panel' },
  { to: '/admin/users', icon: '👥', label: 'Manage Users' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🏆 DSATracker</div>
      <div className="sidebar-subtitle">Competitive Programming</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ height: 12 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 14px', marginBottom: 4 }}>
              Admin
            </div>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div className="user-info">
            <div className="user-name">{user?.displayName || `${user?.firstName} ${user?.lastName}`}</div>
            <div className="user-role">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
