import { ExamSubmission, LiveProctorHeartbeat, ViolationLog, AnswerMap } from '../types';
import { Student } from '../data/studentsData';

const KEYS = {
  APPS_SCRIPT_URL: 'cbt_apps_script_url_v1',
  ADMIN_PIN: 'cbt_admin_pin_v1',
  SUBMISSIONS: 'cbt_submissions_v1',
  PENDING_QUEUE: 'cbt_pending_queue_v1',
  ACTIVE_SESSION: 'cbt_active_session_v1',
  DEVICE_LOGS: 'cbt_device_logs_v1',
  LIVE_HEARTBEATS: 'cbt_live_heartbeats_v1',
};

// Default Google Apps Script URL (User's deployed Google Apps Script Web App)
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFz9xjxSMvACuVcUkyJic7EaNleZkG2eSSKVDXtUNFM05KgmXHe88RV94sisJ5aNuK8g/exec';

export interface ActiveSessionState {
  student: Student;
  answers: AnswerMap;
  curIndex: number;
  timeLeft: number;
  violations: ViolationLog[];
  flaggedQuestions: number[];
  startedAt: string;
}

export const StorageService = {
  getAppsScriptUrl(): string {
    const saved = localStorage.getItem(KEYS.APPS_SCRIPT_URL);
    if (saved && saved.trim() !== '' && !saved.includes('CBT_SAMPLE_PLACEHOLDER')) {
      return saved.trim();
    }
    return DEFAULT_SCRIPT_URL;
  },

  setAppsScriptUrl(url: string): void {
    localStorage.setItem(KEYS.APPS_SCRIPT_URL, url.trim());
  },

  getAdminPin(): string {
    return localStorage.getItem(KEYS.ADMIN_PIN) || 'MATEMATIKA123';
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(KEYS.ADMIN_PIN, pin);
  },

  // Active student in-progress session
  getActiveSession(): ActiveSessionState | null {
    try {
      const data = localStorage.getItem(KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActiveSession(session: ActiveSessionState): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } catch (e) {
      console.error('Error saving session locally', e);
    }
  },

  clearActiveSession(): void {
    localStorage.removeItem(KEYS.ACTIVE_SESSION);
  },

  // Submissions
  getSubmissions(): ExamSubmission[] {
    try {
      const data = localStorage.getItem(KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  hasStudentSubmitted(nisn: string): boolean {
    const list = this.getSubmissions();
    return list.some((item) => item.nisn === nisn);
  },

  getSubmissionByNisn(nisn: string): ExamSubmission | undefined {
    const list = this.getSubmissions();
    return list.find((item) => item.nisn === nisn);
  },

  saveSubmission(submission: ExamSubmission): void {
    const list = this.getSubmissions();
    const existingIndex = list.findIndex((s) => s.nisn === submission.nisn);
    if (existingIndex >= 0) {
      list[existingIndex] = submission;
    } else {
      list.unshift(submission);
    }
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(list));
  },

  // Pending queue for offline / auto-retry sync
  getPendingQueue(): ExamSubmission[] {
    try {
      const data = localStorage.getItem(KEYS.PENDING_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToPendingQueue(sub: ExamSubmission): void {
    const queue = this.getPendingQueue();
    const idx = queue.findIndex((item) => item.nisn === sub.nisn);
    if (idx >= 0) {
      queue[idx] = sub;
    } else {
      queue.push(sub);
    }
    localStorage.setItem(KEYS.PENDING_QUEUE, JSON.stringify(queue));
  },

  removeFromPendingQueue(nisn: string): void {
    const queue = this.getPendingQueue().filter((item) => item.nisn !== nisn);
    localStorage.setItem(KEYS.PENDING_QUEUE, JSON.stringify(queue));
  },

  // Real-time Heartbeats & Proctor State
  getHeartbeats(): Record<string, LiveProctorHeartbeat> {
    try {
      const raw = localStorage.getItem(KEYS.LIVE_HEARTBEATS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  updateHeartbeat(hb: LiveProctorHeartbeat): void {
    const map = this.getHeartbeats();
    map[hb.nisn] = hb;
    localStorage.setItem(KEYS.LIVE_HEARTBEATS, JSON.stringify(map));
  },

  // Audit device logs
  getDeviceLogs(): Array<{ at: string; nisn: string; nama: string; rombel: string; action: string; meta?: string }> {
    try {
      const raw = localStorage.getItem(KEYS.DEVICE_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addDeviceLog(entry: { nisn: string; nama: string; rombel: string; action: string; meta?: string }): void {
    const logs = this.getDeviceLogs();
    logs.unshift({
      ...entry,
      at: new Date().toISOString()
    });
    if (logs.length > 500) logs.pop();
    localStorage.setItem(KEYS.DEVICE_LOGS, JSON.stringify(logs));
  },

  // Reset student submission (Admin only)
  adminResetStudent(nisn: string): void {
    const list = this.getSubmissions().filter((s) => s.nisn !== nisn);
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(list));
    this.removeFromPendingQueue(nisn);

    const hbs = this.getHeartbeats();
    delete hbs[nisn];
    localStorage.setItem(KEYS.LIVE_HEARTBEATS, JSON.stringify(hbs));

    const active = this.getActiveSession();
    if (active && active.student.nisn === nisn) {
      this.clearActiveSession();
    }
  }
};
