import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Attendance from './components/Attendance';
import Analytics from './components/Analytics';
import AiAssistant from './components/AiAssistant';
import { getTodayDateString } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleRecordsUpdated() {
    setRefreshTrigger((prev) => prev + 1);
  }

  const moduleTitles = {
    attendance: 'Attendance Management',
    analytics: 'Analytics & Insights Dashboard',
    assistant: 'AI Learning Assistant (Groq Powered)'
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Viewport */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-title-box">
            <h1>{moduleTitles[activeTab]}</h1>
          </div>
          <div className="header-meta">
            <span>📅 {formattedDate}</span>
          </div>
        </header>

        <main className="content-viewport">
          {activeTab === 'attendance' && (
            <Attendance onRecordsUpdated={handleRecordsUpdated} />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              key={refreshTrigger}
              onNavigateToAttendance={() => setActiveTab('attendance')}
            />
          )}

          {activeTab === 'assistant' && <AiAssistant />}
        </main>
      </div>
    </div>
  );
}
