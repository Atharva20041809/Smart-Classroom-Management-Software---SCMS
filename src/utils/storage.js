const STORAGE_KEY = 'scms_attendance_records_v1';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely retrieve all attendance records from localStorage.
 * Format: { "YYYY-MM-DD": { "STU-1001": "Present", "STU-1002": "Absent" } }
 */
export function getAllAttendanceRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (err) {
    console.error('Error reading attendance records from localStorage:', err);
    return {};
  }
}

/**
 * Retrieve attendance for a specific date string (YYYY-MM-DD).
 * Returns an object { [studentId]: 'Present' | 'Absent' } or null if not saved.
 */
export function getAttendanceForDate(dateString) {
  if (!dateString) return null;
  const all = getAllAttendanceRecords();
  return all[dateString] || null;
}

/**
 * Save attendance map for a specific date string.
 * statusMap: { [studentId]: 'Present' | 'Absent' }
 */
export function saveAttendanceForDate(dateString, statusMap) {
  if (!dateString || !statusMap || typeof statusMap !== 'object') {
    throw new Error('Invalid date or status mapping.');
  }

  try {
    const all = getAllAttendanceRecords();
    all[dateString] = { ...statusMap };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch (err) {
    console.error('Error saving attendance records:', err);
    throw new Error('Failed to save attendance record to local storage.');
  }
}

/**
 * Remove an attendance record for a specific date
 */
export function deleteAttendanceForDate(dateString) {
  if (!dateString) return false;
  try {
    const all = getAllAttendanceRecords();
    if (all[dateString]) {
      delete all[dateString];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    return false;
  }
}
