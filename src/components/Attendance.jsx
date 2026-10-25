import React, { useState, useEffect, useMemo } from 'react';
import { SAMPLE_STUDENTS } from '../data/sampleStudents';
import {
  getTodayDateString,
  getAttendanceForDate,
  saveAttendanceForDate,
  getAllAttendanceRecords,
  deleteAttendanceForDate
} from '../utils/storage';

export default function Attendance({ onRecordsUpdated }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isSavedForSelectedDate, setIsSavedForSelectedDate] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [allHistory, setAllHistory] = useState({});

  // Reload records whenever selected date changes
  useEffect(() => {
    loadDateRecords(selectedDate);
    refreshHistory();
  }, [selectedDate]);

  function loadDateRecords(date) {
    const saved = getAttendanceForDate(date);
    if (saved) {
      setAttendanceMap(saved);
      setIsSavedForSelectedDate(true);
    } else {
      // Default initial state: all students unassigned or keep clean
      // Let's initialize with an empty map or default unassigned
      const initial = {};
      SAMPLE_STUDENTS.forEach((s) => {
        initial[s.id] = 'Present'; // Friendly default to save teachers time
      });
      setAttendanceMap(initial);
      setIsSavedForSelectedDate(false);
    }
    setSaveMessage(null);
  }

  function refreshHistory() {
    const all = getAllAttendanceRecords();
    setAllHistory(all);
  }

  // Toggle or set a specific student's attendance
  function setStudentStatus(id, status) {
    setAttendanceMap((prev) => ({
      ...prev,
      [id]: status
    }));
    setIsSavedForSelectedDate(false);
    setSaveMessage(null);
  }

  // Mark all currently visible or all students as Present
  function handleMarkAllPresent() {
    const updated = { ...attendanceMap };
    SAMPLE_STUDENTS.forEach((s) => {
      updated[s.id] = 'Present';
    });
    setAttendanceMap(updated);
    setIsSavedForSelectedDate(false);
  }

  // Mark all students as Absent
  function handleMarkAllAbsent() {
    const updated = { ...attendanceMap };
    SAMPLE_STUDENTS.forEach((s) => {
      updated[s.id] = 'Absent';
    });
    setAttendanceMap(updated);
    setIsSavedForSelectedDate(false);
  }

  // Reset current selection with confirmation
  function handleReset() {
    if (window.confirm(`Reset attendance changes for ${selectedDate}?`)) {
      loadDateRecords(selectedDate);
    }
  }

  // Save attendance
  function handleSave() {
    try {
      saveAttendanceForDate(selectedDate, attendanceMap);
      setIsSavedForSelectedDate(true);
      setSaveMessage(`Attendance for ${selectedDate} has been saved successfully!`);
      refreshHistory();
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err) {
      alert('Failed to save attendance: ' + err.message);
    }
  }

  // Delete history entry
  function handleDeleteRecord(date) {
    if (window.confirm(`Are you sure you want to delete attendance record for ${date}?`)) {
      deleteAttendanceForDate(date);
      refreshHistory();
      if (date === selectedDate) {
        loadDateRecords(selectedDate);
      }
      if (onRecordsUpdated) onRecordsUpdated();
    }
  }

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return SAMPLE_STUDENTS;
    const term = searchTerm.toLowerCase();
    return SAMPLE_STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.class.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Statistics for current selected date
  const totalStudents = SAMPLE_STUDENTS.length;
  const presentCount = Object.values(attendanceMap).filter((status) => status === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((status) => status === 'Absent').length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // History dates array sorted newest to oldest
  const historyDates = Object.keys(allHistory).sort((a, b) => b.localeCompare(a));

  return (
    <div className="attendance-module">
      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-sub">Enrolled in roster</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Present</div>
          <div className="stat-value present">{presentCount}</div>
          <div className="stat-sub">Marked present for {selectedDate}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Absent</div>
          <div className="stat-value absent">{absentCount}</div>
          <div className="stat-sub">Marked absent for {selectedDate}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Attendance Rate</div>
          <div className="stat-value percent">{attendancePercentage}%</div>
          <div className="stat-sub">Calculated for {selectedDate}</div>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveMessage && (
        <div className="alert-banner alert-success">
          <span>✓</span>
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Attendance Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Mark Student Attendance</div>
            <div className="card-subtitle">
              {isSavedForSelectedDate ? (
                <span style={{ color: 'var(--success)' }}>
                  ✓ Record saved in local storage for this date
                </span>
              ) : (
                <span style={{ color: 'var(--warning-text)' }}>
                  ● Unsaved changes for selected date
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide History' : `View Saved History (${historyDates.length})`}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save Attendance
            </button>
          </div>
        </div>

        {/* Date Selector and Search Controls */}
        <div className="controls-bar">
          <div className="controls-left">
            <label style={{ fontSize: '13px', fontWeight: '500' }}>
              Attendance Date:
              <input
                type="date"
                className="form-input"
                style={{ marginLeft: '8px' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>

            <input
              type="text"
              placeholder="Search by student name, ID or class..."
              className="form-input"
              style={{ width: '280px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>

          <div className="controls-right">
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllPresent}>
              Mark All Present
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllAbsent}>
              Mark All Absent
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              Reset Selection
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Student ID</th>
                <th>Student Name</th>
                <th style={{ width: '140px' }}>Class</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Mark Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                    No students found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const status = attendanceMap[student.id] || 'Absent';
                  const isPresent = status === 'Present';

                  return (
                    <tr key={student.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {student.id}
                      </td>
                      <td style={{ fontWeight: '500' }}>{student.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{student.class}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="status-btn-group">
                          <button
                            type="button"
                            className={`status-toggle-btn ${isPresent ? 'active-present' : ''}`}
                            onClick={() => setStudentStatus(student.id, 'Present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`status-toggle-btn ${!isPresent ? 'active-absent' : ''}`}
                            onClick={() => setStudentStatus(student.id, 'Absent')}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Records History Section */}
      {showHistory && (
        <div className="card history-section">
          <div className="card-header">
            <div>
              <div className="card-title">Saved Attendance History</div>
              <div className="card-subtitle">
                All records stored securely in browser localStorage
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>

          {historyDates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No Saved Records Yet</div>
              <div className="empty-state-desc">
                When you click "Save Attendance" above, the date record will appear here.
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Present Students</th>
                    <th>Absent Students</th>
                    <th>Attendance Rate</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyDates.map((date) => {
                    const record = allHistory[date] || {};
                    const pCount = Object.values(record).filter((s) => s === 'Present').length;
                    const aCount = Object.values(record).filter((s) => s === 'Absent').length;
                    const total = pCount + aCount;
                    const pct = total > 0 ? Math.round((pCount / total) * 100) : 0;
                    const isCurrent = date === selectedDate;

                    return (
                      <tr key={date} style={isCurrent ? { backgroundColor: '#eff6ff' } : {}}>
                        <td style={{ fontWeight: '600' }}>
                          {date} {isCurrent && <span style={{ color: 'var(--primary)', fontSize: '11px' }}>(Viewing)</span>}
                        </td>
                        <td style={{ color: 'var(--success)', fontWeight: '500' }}>{pCount}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: '500' }}>{aCount}</td>
                        <td style={{ fontWeight: '600' }}>{pct}%</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => setSelectedDate(date)}
                          >
                            Load
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRecord(date)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
