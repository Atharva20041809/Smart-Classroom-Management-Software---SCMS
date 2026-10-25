import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SAMPLE_STUDENTS } from '../data/sampleStudents';
import { getAllAttendanceRecords, getTodayDateString } from '../utils/storage';

export default function Analytics({ onNavigateToAttendance }) {
  const records = getAllAttendanceRecords();
  const todayStr = getTodayDateString();

  const totalEnrolled = SAMPLE_STUDENTS.length;

  // Saved dates sorted chronologically
  const recordedDates = useMemo(() => {
    return Object.keys(records).sort((a, b) => a.localeCompare(b));
  }, [records]);

  // Today's statistics
  const todayRecord = records[todayStr];
  const hasTodayRecord = Boolean(todayRecord);

  const todayPresent = useMemo(() => {
    if (!todayRecord) return 0;
    return Object.values(todayRecord).filter((s) => s === 'Present').length;
  }, [todayRecord]);

  const todayAbsent = useMemo(() => {
    if (!todayRecord) return 0;
    return Object.values(todayRecord).filter((s) => s === 'Absent').length;
  }, [todayRecord]);

  const todayPercentage = useMemo(() => {
    if (!todayRecord || totalEnrolled === 0) return 0;
    return Math.round((todayPresent / totalEnrolled) * 100);
  }, [todayRecord, todayPresent, totalEnrolled]);

  // Bar Chart Data: Recent recorded dates (last 7 recorded dates)
  const recentBarData = useMemo(() => {
    const recentKeys = recordedDates.slice(-7);
    return recentKeys.map((dateKey) => {
      const rec = records[dateKey] || {};
      const present = Object.values(rec).filter((s) => s === 'Present').length;
      const absent = Object.values(rec).filter((s) => s === 'Absent').length;
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        date: dateKey,
        Present: present,
        Absent: absent,
        Rate: rate
      };
    });
  }, [records, recordedDates]);

  // Overall Cumulative Present vs. Absent Distribution
  const overallDistribution = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;

    recordedDates.forEach((dateKey) => {
      const rec = records[dateKey] || {};
      Object.values(rec).forEach((status) => {
        if (status === 'Present') totalPresent += 1;
        if (status === 'Absent') totalAbsent += 1;
      });
    });

    if (totalPresent === 0 && totalAbsent === 0) {
      return [];
    }

    return [
      { name: 'Present', value: totalPresent, color: '#16a34a' },
      { name: 'Absent', value: totalAbsent, color: '#dc2626' }
    ];
  }, [records, recordedDates]);

  const hasAnyRecords = recordedDates.length > 0;

  return (
    <div className="analytics-module">
      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sample Students</div>
          <div className="stat-value">{totalEnrolled}</div>
          <div className="stat-sub">Active class roster</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Present Today ({todayStr})</div>
          <div className="stat-value present">
            {hasTodayRecord ? todayPresent : '—'}
          </div>
          <div className="stat-sub">
            {hasTodayRecord ? 'Recorded in local storage' : 'Not yet saved for today'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Absent Today ({todayStr})</div>
          <div className="stat-value absent">
            {hasTodayRecord ? todayAbsent : '—'}
          </div>
          <div className="stat-sub">
            {hasTodayRecord ? 'Recorded in local storage' : 'Not yet saved for today'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Today's Attendance Rate</div>
          <div className="stat-value percent">
            {hasTodayRecord ? `${todayPercentage}%` : '—'}
          </div>
          <div className="stat-sub">
            {hasTodayRecord ? `${todayPresent} of ${totalEnrolled} present` : 'Record pending'}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      {!hasAnyRecords ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Attendance Records Found</div>
            <div className="empty-state-desc">
              Analytics are generated strictly from genuine attendance data stored in your system.
              Mark and save attendance for today or any past date in Attendance Management to view analytics.
            </div>
            {onNavigateToAttendance && (
              <button
                className="btn btn-primary"
                onClick={onNavigateToAttendance}
              >
                Go to Attendance Management
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="charts-grid">
            {/* Bar Chart: Recent Dates */}
            <div className="chart-card">
              <div className="chart-title">Attendance Trends (Recent Saved Dates)</div>
              <div className="chart-subtitle">
                Student count marked Present and Absent across recent class sessions
              </div>
              <div className="chart-container-inner">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={recentBarData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [`${val} students`, name]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                    <Bar dataKey="Present" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Absent" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Overall Present vs Absent */}
            <div className="chart-card">
              <div className="chart-title">Overall Distribution</div>
              <div className="chart-subtitle">
                Present vs Absent cumulative ratio across {recordedDates.length} recorded session(s)
              </div>
              <div className="chart-container-inner">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={overallDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {overallDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} marks`, 'Total']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Summary Table */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              Historical Record Breakdown
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Present Students</th>
                    <th>Absent Students</th>
                    <th>Total Students Recorded</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBarData.map((row) => (
                    <tr key={row.date}>
                      <td style={{ fontWeight: '600' }}>{row.date}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '500' }}>{row.Present}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '500' }}>{row.Absent}</td>
                      <td>{row.Present + row.Absent}</td>
                      <td style={{ fontWeight: '600' }}>{row.Rate}%</td>
                      <td>
                        <span className={`badge ${row.Rate >= 75 ? 'badge-present' : 'badge-absent'}`}>
                          {row.Rate >= 75 ? 'Optimal' : 'Low Attendance'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
