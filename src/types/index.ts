import { Student } from '../data/studentsData';
import { Question } from '../data/questionsData';

export type { Student, Question };

export type AnswerValue = number | number[] | boolean[];

export interface AnswerMap {
  [questionNo: number]: AnswerValue;
}

export interface ViolationLog {
  id: string;
  reason: string;
  at: string;
  type: 'tab_switch' | 'blur' | 'fullscreen_exit' | 'devtools_or_shortcut' | 'screen_record_attempt' | 'window_resize' | 'other';
}

export interface ExamSubmission {
  id: string;
  nama: string;
  rombel: string;
  nipd: string;
  nisn: string;
  jk: string;
  score: number;
  rawEarned: number;
  totalQuestions: number;
  answeredCount: number;
  answers: AnswerMap;
  violations: ViolationLog[];
  violationCount: number;
  reason: string;
  submittedAt: string;
  durationUsedSeconds: number;
  userAgent: string;
  screenResolution: string;
  ipAddress?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  syncTimestamp?: string;
  syncError?: string;
}

export interface LiveProctorHeartbeat {
  studentId: string;
  nisn: string;
  nama: string;
  rombel: string;
  nipd: string;
  progressPercent: number;
  answeredCount: number;
  flaggedCount: number;
  currentQuestion: number;
  violationCount: number;
  lastViolation?: string;
  lastActive: string;
  status: 'active' | 'idle' | 'submitted';
  deviceInfo: {
    screen: string;
    isMobile: boolean;
    batteryLevel?: number;
    platform: string;
  };
}

export interface AppConfig {
  appsScriptUrl: string;
  autoSyncIntervalMs: number;
  examTitle: string;
  allowRetakeByAdmin: boolean;
}
