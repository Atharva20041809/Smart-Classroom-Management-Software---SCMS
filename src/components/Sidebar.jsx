import React from 'react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'attendance', label: 'Attendance Management', icon: '📋' },
    { id: 'analytics', label: 'Analytics Dashboard', icon: '📊' },
    { id: 'assistant', label: 'AI Learning Assistant', icon: '🤖' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-title">SCMS Desktop</div>
        <div className="brand-subtitle">Smart Classroom Management</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Version 1.0.0 (Offline-first)</div>
        <div style={{ marginTop: '3px' }}>Groq AI Powered</div>
      </div>
    </aside>
  );
}
