import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student } from '../data/studentsData';
import { QUESTIONS_DATA, Question, PGQuestion, MCMAQuestion, BSQuestion, EXAM_DURATION_SECONDS } from '../data/questionsData';
import { AnswerMap, ViolationLog, ExamSubmission } from '../types';
import { StorageService, ActiveSessionState } from '../services/storageService';
import { SheetService } from '../services/sheetService';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Grid, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldAlert, 
  Maximize2, 
  Minimize2, 
  Wifi, 
  WifiOff, 
  Send,
  X,
  HelpCircle
} from 'lucide-react';

interface ExamViewProps {
  student: Student;
  onFinishExam: (submission: ExamSubmission) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({ student, onFinishExam }) => {
  // Load saved session if exists for this student
  const savedSession = StorageService.getActiveSession();
  const isResuming = savedSession && savedSession.student.nisn === student.nisn;

  const [cur, setCur] = useState<number>(isResuming ? savedSession.curIndex : 0);
  const [answers, setAnswers] = useState<AnswerMap>(isResuming ? savedSession.answers : {});
  const [flagged, setFlagged] = useState<number[]>(isResuming ? savedSession.flaggedQuestions : []);
  const [timeLeft, setTimeLeft] = useState<number>(isResuming ? savedSession.timeLeft : EXAM_DURATION_SECONDS);
  const [violations, setViolations] = useState<ViolationLog[]>(isResuming ? savedSession.violations : []);
  
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [latestViolationAlert, setLatestViolationAlert] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const endedRef = useRef<boolean>(false);
  const answersRef = useRef<AnswerMap>(answers);
  const violationsRef = useRef<ViolationLog[]>(violations);
  const flaggedRef = useRef<number[]>(flagged);
  const curRef = useRef<number>(cur);
  const timeLeftRef = useRef<number>(timeLeft);

  answersRef.current = answers;
  violationsRef.current = violations;
  flaggedRef.current = flagged;
  curRef.current = cur;
  timeLeftRef.current = timeLeft;

  // Persist session to local storage
  const persistSession = useCallback(() => {
    if (endedRef.current) return;
    const state: ActiveSessionState = {
      student,
      answers: answersRef.current,
      curIndex: curRef.current,
      timeLeft: timeLeftRef.current,
      violations: violationsRef.current,
      flaggedQuestions: flaggedRef.current,
      startedAt: isResuming && savedSession ? savedSession.startedAt : new Date().toISOString()
    };
    StorageService.saveActiveSession(state);
  }, [student, isResuming, savedSession]);

  // Log Violation & Dispatch to Google Sheet + Proctor
  const recordViolation = useCallback((reason: string, type: ViolationLog['type']) => {
    if (endedRef.current) return;

    // Trigger phone vibration if available
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {
      // ignore
    }

    const newViolation: ViolationLog = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reason,
      type,
      at: new Date().toISOString()
    };

    setViolations((prev) => {
      const updated = [...prev, newViolation];
      violationsRef.current = updated;
      return updated;
    });

    setLatestViolationAlert(reason);
    setTimeout(() => {
      setLatestViolationAlert((curr) => (curr === reason ? null : curr));
    }, 6000);

    // Send realtime violation event
    SheetService.logViolationRealtime(newViolation, {
      nisn: student.nisn,
      nama: student.nama,
      rombel: student.rombel,
      userAgent: navigator.userAgent
    });

    persistSession();
  }, [student, persistSession]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit('Waktu Ujian Habis Secara Otomatis');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Heartbeat & Periodic Autosave (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (endedRef.current) return;
      persistSession();

      const answeredCount = Object.keys(answersRef.current).length;
      SheetService.sendHeartbeat({
        studentId: student.nipd,
        nisn: student.nisn,
        nama: student.nama,
        rombel: student.rombel,
        nipd: student.nipd,
        progressPercent: Math.round((answeredCount / QUESTIONS_DATA.length) * 100),
        answeredCount,
        flaggedCount: flaggedRef.current.length,
        currentQuestion: curRef.current + 1,
        violationCount: violationsRef.current.length,
        lastViolation: violationsRef.current.length > 0 ? violationsRef.current[violationsRef.current.length - 1].reason : undefined,
        lastActive: new Date().toISOString(),
        status: 'active',
        deviceInfo: {
          screen: `${window.screen.width}x${window.screen.height}`,
          isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
          platform: navigator.platform
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [student, persistSession]);

  // Anti-Cheat Event Listeners (Tab switch, Blur, Fullscreen, Shortcuts, Screen record attempts)
  useEffect(() => {
    // 1. Tab switch or hide
    const handleVisibilityChange = () => {
      if (document.hidden && !endedRef.current) {
        recordViolation('Meninggalkan aplikasi / berpindah tab browser', 'tab_switch');
      }
    };

    // 2. Window Blur (loss of focus)
    const handleWindowBlur = () => {
      if (!endedRef.current && document.visibilityState === 'visible') {
        recordViolation('Jendela ujian kehilangan fokus (kemungkinan membuka aplikasi lain atau notifikasi)', 'blur');
      }
    };

    // 3. Fullscreen state change
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && !endedRef.current) {
        recordViolation('Keluar dari mode Layar Penuh (Fullscreen)', 'fullscreen_exit');
      }
    };

    // 4. Block context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 5. Block copy, cut, paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('Mencoba menyalin (Copy) konten ujian', 'other');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('Mencoba menempel (Paste) teks', 'other');
    };

    // 6. Block Devtools & Cheating Key Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('Mencoba membuka Developer Tools (F12)', 'devtools_or_shortcut');
        return;
      }
      // Ctrl+Shift+I, J, C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
        e.preventDefault();
        recordViolation('Mencoba membuka inspect element / devtools', 'devtools_or_shortcut');
        return;
      }
      // Ctrl+U (view source), Ctrl+S (save), Ctrl+P (print)
      if (e.ctrlKey && ['u', 's', 'p', 'U', 'S', 'P'].includes(e.key)) {
        e.preventDefault();
        recordViolation(`Mencoba pintasan browser dilarang (Ctrl+${e.key.toUpperCase()})`, 'devtools_or_shortcut');
        return;
      }
      // PrintScreen Key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        recordViolation('Mencoba mengambil tangkapan layar (Print Screen)', 'screen_record_attempt');
        return;
      }
    };

    // 7. Screen recording / Display media detection heuristic
    const handleResize = () => {
      // sudden dramatic height or aspect ratio changes often occur when screen capture banner appears
      if (window.innerHeight < 250 && !endedRef.current) {
        recordViolation('Deteksi kemungkinan split screen atau overlay perekaman layar', 'window_resize');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [recordViolation]);

  // Request fullscreen trigger
  const triggerFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // Evaluate if a specific question is answered
  const isQuestionAnswered = (q: Question) => {
    const a = answers[q.no];
    if (a === undefined || a === null) return false;
    if (q.type === 'pg') return typeof a === 'number';
    if (q.type === 'mcma') return Array.isArray(a) && (a as number[]).length > 0;
    if (q.type === 'bs') {
      const bsArr = a as boolean[];
      return Array.isArray(bsArr) && bsArr.length === q.st.length && bsArr.every((x) => typeof x === 'boolean');
    }
    return false;
  };

  const answeredCount = QUESTIONS_DATA.filter((q) => isQuestionAnswered(q)).length;
  const allAnswered = answeredCount === QUESTIONS_DATA.length;

  // Score Calculation (Internal proctor only - not exposed to student)
  const calculateScore = () => {
    let earned = 0;
    QUESTIONS_DATA.forEach((q) => {
      const a = answers[q.no];
      if (q.type === 'pg') {
        if (a === q.ans) earned += 1;
      } else if (q.type === 'mcma') {
        const sel = (a as number[]) || [];
        if (sel.length === q.cor.length && sel.every((x) => q.cor.includes(x))) {
          earned += 1;
        }
      } else if (q.type === 'bs') {
        const sel = (a as boolean[]) || [];
        const per = 1 / q.cor.length;
        q.cor.forEach((v, i) => {
          if (sel[i] === v) earned += per;
        });
      }
    });

    const finalScore = Math.round((earned / QUESTIONS_DATA.length) * 100);
    return { earned: Math.round(earned * 100) / 100, finalScore };
  };

  // Handle Exam Submission
  const handleFinalSubmit = async (reason = 'Dikumpulkan oleh Peserta') => {
    if (endedRef.current || isSubmitting) return;

    // Validasi ketat: Peserta TIDAK BISA menyelesaikan sebelum seluruh soal dijawab!
    const isAutoTimer = reason.includes('Waktu Ujian Habis');
    if (!isAutoTimer && answeredCount < QUESTIONS_DATA.length) {
      alert(`Anda belum dapat menyelesaikan ujian! Masih ada ${QUESTIONS_DATA.length - answeredCount} soal yang belum dijawab. Seluruh 25 nomor soal wajib diisi.`);
      return;
    }

    endedRef.current = true;
    setIsSubmitting(true);

    // Exit fullscreen cleanly
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }

    const { earned, finalScore } = calculateScore();
    const finalAnswered = answeredCount;

    const submission: ExamSubmission = {
      id: 'sub_' + student.nisn + '_' + Date.now(),
      nama: student.nama,
      rombel: student.rombel,
      nipd: student.nipd,
      nisn: student.nisn,
      jk: student.jk,
      score: finalScore,
      rawEarned: earned,
      totalQuestions: QUESTIONS_DATA.length,
      answeredCount: finalAnswered,
      answers: answersRef.current,
      violations: violationsRef.current,
      violationCount: violationsRef.current.length,
      reason,
      submittedAt: new Date().toISOString(),
      durationUsedSeconds: EXAM_DURATION_SECONDS - timeLeftRef.current,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      syncStatus: 'pending'
    };

    // Save locally immediately
    StorageService.saveSubmission(submission);
    StorageService.clearActiveSession();

    // Send to Google Spreadsheet via SheetService
    await SheetService.sendSubmission(submission);

    onFinishExam(submission);
  };

  // Answer handlers
  const handleSetPG = (no: number, index: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [no]: index };
      answersRef.current = next;
      return next;
    });
    persistSession();
  };

  const handleToggleMCMA = (no: number, index: number) => {
    setAnswers((prev) => {
      const current = (prev[no] as number[]) || [];
      const exists = current.indexOf(index);
      let updated: number[];
      if (exists > -1) {
        updated = current.filter((x) => x !== index);
      } else {
        updated = [...current, index];
      }
      const next = { ...prev, [no]: updated };
      answersRef.current = next;
      return next;
    });
    persistSession();
  };

  const handleSetBS = (no: number, index: number, value: boolean) => {
    setAnswers((prev) => {
      const current = [...((prev[no] as boolean[]) || [])];
      current[index] = value;
      const next = { ...prev, [no]: current };
      answersRef.current = next;
      return next;
    });
    persistSession();
  };

  const toggleFlag = (no: number) => {
    setFlagged((prev) => {
      const exists = prev.includes(no);
      const next = exists ? prev.filter((x) => x !== no) : [...prev, no];
      flaggedRef.current = next;
      return next;
    });
    persistSession();
  };

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = QUESTIONS_DATA[cur];

  const isLowTime = timeLeft <= 300; // 5 minutes remaining

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Dynamic Anti-Photo/Record Watermark (Requirement #9) */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex flex-wrap gap-16 p-8 opacity-[0.035] select-none text-[11px] font-mono leading-none tracking-widest text-white rotate-[-20deg]">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i}>
            {student.nama} • {student.nisn} • SMKN 2 GORONTALO • CBT
          </span>
        ))}
      </div>

      {/* Floating Violation Alert Notification */}
      {latestViolationAlert && (
        <div className="fixed top-14 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-rose-950 border-2 border-rose-500 rounded-2xl p-3.5 shadow-2xl shadow-rose-950 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-rose-200 uppercase tracking-wide flex items-center justify-between">
              <span>Peringatan Keamanan CBT</span>
              <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">
                Pelanggaran #{violations.length}
              </span>
            </div>
            <p className="text-slate-200 mt-1">
              Terdeteksi: <strong className="text-white">{latestViolationAlert}</strong>.
            </p>
            <p className="text-[10px] text-rose-300/90 mt-0.5">
              {violations.length >= 3 
                ? 'Soal TIDAK dikunci (Anda tetap dapat melanjutkan), namun status waspada telah aktif di Dashboard Pengawas.'
                : 'Insiden ini telah dicatat ke log Google Spreadsheet & Pengawas Ruang.'}
            </p>
          </div>
          <button
            onClick={() => setLatestViolationAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header (Mobile Sticky) */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          {/* Student Info */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              {student.rombel.split('-')[1] || 'SMK'}
            </div>
            <div className="truncate">
              <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                <span>{student.nama}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {student.nisn}
                </span>
              </div>
              <div className="text-[11px] text-cyan-400 font-medium truncate">
                {student.rombel}
              </div>
            </div>
          </div>

          {/* Right Controls: Timer & Drawer Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Online Badge */}
            <div className="hidden sm:flex items-center text-[10px] text-slate-400 gap-1 px-2 py-1 bg-slate-800 rounded-lg">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-400" />
                  <span className="text-rose-400 font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={triggerFullscreen}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                isFullscreen
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-rose-950/60 border-rose-600/50 text-rose-300 animate-pulse'
              }`}
              title={isFullscreen ? 'Layar Penuh Aktif' : 'Aktifkan Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-bold border transition ${
                isLowTime
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-400' : 'text-blue-400'}`} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Drawer button (Soal Grid) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-600/20 transition"
              title="Daftar Soal"
            >
              <Grid className="w-4 h-4" />
              <span className="text-[11px] font-mono hidden xs:inline">{answeredCount}/25</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Question Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3 sm:p-5 pb-24 space-y-3">
        {/* Fullscreen Alert Banner if not in fullscreen */}
        {!isFullscreen && (
          <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-2.5 text-xs text-rose-200 flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Mode Layar Penuh tidak aktif! Klik tombol di samping untuk mengaktifkan kembali.</span>
            </div>
            <button
              onClick={triggerFullscreen}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] shrink-0"
            >
              Aktifkan
            </button>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Header Soal & Type */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-lg font-bold text-xs">
                Soal #{currentQ.no}
              </span>
              <span className="text-[11px] text-slate-400">
                dari 25 Soal
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Type Badge */}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {currentQ.type === 'pg' ? 'Pilihan Ganda' : currentQ.type === 'mcma' ? 'PG Kompleks' : 'Benar / Salah'}
              </span>

              {/* Ragu-ragu Toggle */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.no)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  flagged.includes(currentQ.no)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
                title="Tandai Ragu-ragu"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Ragu-ragu</span>
              </button>
            </div>
          </div>

          {/* Stimulus / Reading / Graphics / Tables */}
          {currentQ.stim && (
            <div className="bg-slate-950/70 border-l-4 border-blue-500 border-y border-r border-slate-800/80 rounded-r-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Stimulus / Bacaan:
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: currentQ.stim }}
                className="space-y-2 text-slate-200"
              />
            </div>
          )}

          {/* Question Text */}
          <div className="text-sm sm:text-base font-semibold text-white leading-relaxed pt-1">
            {currentQ.text}
          </div>

          {/* Answer Options Area */}
          <div className="pt-2 space-y-2.5">
            {/* TYPE 1: PG (Single Choice Radio) */}
            {currentQ.type === 'pg' && (
              <div className="space-y-2">
                {(currentQ as PGQuestion).opt.map((optionText, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentQ.no] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSetPG(currentQ.no, idx)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition active:scale-[0.99] ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="flex-1 leading-normal pt-0.5">{optionText}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: MCMA (Multiple Choice Multiple Answers / Checkboxes) */}
            {currentQ.type === 'mcma' && (
              <div className="space-y-2">
                <div className="text-[11px] text-cyan-400 font-medium">
                  * Pilih semua pilihan yang bernilai benar (dapat lebih dari satu jawaban)
                </div>
                {(currentQ as MCMAQuestion).st.map((statement, idx) => {
                  const selectedArr = (answers[currentQ.no] as number[]) || [];
                  const isChecked = selectedArr.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleMCMA(currentQ.no, idx)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition active:scale-[0.99] ${
                        isChecked
                          ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="flex-1 leading-normal">{statement}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 3: BS (Benar / Salah Matrix Table) */}
            {currentQ.type === 'bs' && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-800">
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5 text-left">Pernyataan</th>
                      <th className="p-2.5 text-center w-16 text-emerald-400 font-bold">Benar</th>
                      <th className="p-2.5 text-center w-16 text-rose-400 font-bold">Salah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(currentQ as BSQuestion).st.map((statement, idx) => {
                      const currentBs = (answers[currentQ.no] as boolean[]) || [];
                      const val = currentBs[idx];
                      return (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 text-slate-200 leading-snug">{statement}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSetBS(currentQ.no, idx, true)}
                              className={`w-7 h-7 rounded-lg font-bold text-xs transition border ${
                                val === true
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              B
                            </button>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSetBS(currentQ.no, idx, false)}
                              className={`w-7 h-7 rounded-lg font-bold text-xs transition border ${
                                val === false
                                  ? 'bg-rose-600 border-rose-500 text-white'
                                  : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              S
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
        </div>
      </main>

      {/* Bottom Sticky Action Bar (Optimized for Mobile Thumbs) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 sm:p-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          {/* Previous Button */}
          <button
            type="button"
            disabled={cur === 0}
            onClick={() => setCur((prev) => Math.max(0, prev - 1))}
            className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 border transition active:scale-95 ${
              cur === 0
                ? 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Sebelumnya</span>
          </button>

          {/* Center: Question Indicator / Quick Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 flex items-center gap-1.5"
          >
            <span className="font-bold text-white">Soal {cur + 1}</span>
            <span className="text-slate-500">/ 25</span>
          </button>

          {/* Right Action: Next or Finish */}
          {cur < QUESTIONS_DATA.length - 1 ? (
            <button
              type="button"
              onClick={() => setCur((prev) => Math.min(QUESTIONS_DATA.length - 1, prev + 1))}
              className="py-2.5 px-4 sm:px-5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-md shadow-blue-600/20 transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => {
                if (!allAnswered) {
                  alert(`Anda belum dapat menyelesaikan ujian! Masih ada ${QUESTIONS_DATA.length - answeredCount} nomor soal yang belum dijawab. Seluruh 25 soal wajib diisi.`);
                  setIsDrawerOpen(true);
                  return;
                }
                setShowConfirmSubmit(true);
              }}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition ${
                !allAnswered
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-600/30'
              }`}
              title={!allAnswered ? 'Seluruh 25 nomor soal wajib dijawab terlebih dahulu' : 'Selesai & Kumpulkan'}
            >
              <Send className="w-4 h-4" />
              <span>
                {!allAnswered ? `Lengkapi Soal (${answeredCount}/25)` : 'Selesai & Kumpulkan'}
              </span>
            </button>
          )}
        </div>
      </footer>

      {/* Question Navigation Drawer (Modal Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">Daftar Nomor Soal</h3>
                <p className="text-xs text-slate-400">
                  Terjawab: <strong className="text-emerald-400">{answeredCount}</strong> / 25
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 py-3 text-[11px] text-slate-400 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" /> Terjawab
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" /> Ragu-ragu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 inline-block" /> Belum Dijawab
              </span>
            </div>

            {/* Grid 5x5 */}
            <div className="grid grid-cols-5 gap-2.5 py-4 overflow-y-auto">
              {QUESTIONS_DATA.map((q, idx) => {
                const isCurrent = cur === idx;
                const isAnswered = isQuestionAnswered(q);
                const isFlagged = flagged.includes(q.no);

                let btnClass = 'bg-slate-800 border-slate-700 text-slate-300';
                if (isAnswered) btnClass = 'bg-emerald-600 border-emerald-500 text-white font-semibold';
                if (isFlagged) btnClass = 'bg-amber-500 border-amber-400 text-slate-950 font-bold';

                return (
                  <button
                    key={q.no}
                    type="button"
                    onClick={() => {
                      setCur(idx);
                      setIsDrawerOpen(false);
                    }}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs transition relative active:scale-95 ${btnClass} ${
                      isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 font-black' : ''
                    }`}
                  >
                    <span>{q.no}</span>
                    {isFlagged && <Flag className="w-2.5 h-2.5 absolute top-1 right-1" />}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {!allAnswered && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Masih ada <strong>{QUESTIONS_DATA.length - answeredCount} nomor soal</strong> belum dijawab. Seluruh 25 soal wajib diisi sebelum dapat mengumpulkan ujian.
                  </span>
                </div>
              )}
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() => {
                  if (!allAnswered) return;
                  setIsDrawerOpen(false);
                  setShowConfirmSubmit(true);
                }}
                className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                  !allAnswered
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {!allAnswered
                    ? `Wajib Jawab Semua Soal (${answeredCount}/25)`
                    : 'Kumpulkan Ujian Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Konfirmasi Pengumpulan Ujian</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin mengakhiri dan mengumpulkan lembar jawaban ini?
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Soal:</span>
                <strong className="text-white">25 Soal</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sudah Terjawab:</span>
                <strong className="text-emerald-400">{answeredCount} Soal</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ditandai Ragu-ragu:</span>
                <strong className="text-amber-400">{flagged.length} Soal</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Belum Terjawab:</span>
                <strong className="text-rose-400">{25 - answeredCount} Soal</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Sisa Waktu:</span>
                <strong className="text-cyan-400 font-mono">{formatTime(timeLeft)}</strong>
              </div>
            </div>

            {25 - answeredCount > 0 && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-600/40 rounded-xl text-rose-300 text-xs">
                Perhatian: Masih ada <strong>{25 - answeredCount} soal</strong> yang belum Anda jawab.
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting || !allAnswered}
                onClick={() => handleFinalSubmit('Dikumpulkan oleh Peserta')}
                className={`w-1/2 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                  !allAnswered
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{!allAnswered ? 'Belum Lengkap' : 'Ya, Kumpulkan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
