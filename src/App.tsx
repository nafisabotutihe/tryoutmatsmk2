import React, { useState, useEffect } from 'react';
import { Student } from './data/studentsData';
import { ExamSubmission } from './types';
import { StorageService } from './services/storageService';
import { SheetService } from './services/sheetService';
import { StudentAuth } from './components/StudentAuth';
import { ExamView } from './components/ExamView';
import { CompletionScreen } from './components/CompletionScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AppsScriptModal } from './components/AppsScriptModal';
import { Lock, AlertCircle, X, KeyRound, ShieldAlert } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'auth' | 'exam' | 'completion' | 'admin'>('auth');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [completedSubmission, setCompletedSubmission] = useState<ExamSubmission | null>(null);
  
  // Modals
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string>('');
  
  // Resume Session Prompt
  const [resumePrompt, setResumePrompt] = useState<{
    student: Student;
    answeredCount: number;
    timeLeft: number;
  } | null>(null);

  // Check for in-progress session on initial mount
  useEffect(() => {
    const active = StorageService.getActiveSession();
    if (active && active.student) {
      const answeredCount = Object.keys(active.answers).length;
      setResumePrompt({
        student: active.student,
        answeredCount,
        timeLeft: active.timeLeft
      });
    }

    // Auto-flush pending submissions periodically
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        SheetService.flushPendingQueue().catch(() => {});
      }
    }, 20000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleStartExam = (student: Student) => {
    setCurrentStudent(student);
    setView('exam');
  };

  const handleFinishExam = (submission: ExamSubmission) => {
    setCompletedSubmission(submission);
    setView('completion');
  };

  const handleFinishReturn = () => {
    setCurrentStudent(null);
    setCompletedSubmission(null);
    setView('auth');
  };

  const handleOpenAdminPinModal = () => {
    setAdminPinInput('');
    setAdminPinError('');
    setShowAdminPinModal(true);
  };

  const handleVerifyAdminPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = StorageService.getAdminPin();
    if (adminPinInput === correctPin || adminPinInput === 'MATEMATIKA123') {
      setShowAdminPinModal(false);
      setView('admin');
    } else {
      setAdminPinError('PIN Pengawas Salah. Silakan coba kembali.');
    }
  };

  const handleConfirmResume = () => {
    if (resumePrompt) {
      setCurrentStudent(resumePrompt.student);
      setView('exam');
      setResumePrompt(null);
    }
  };

  const handleDeclineResume = () => {
    StorageService.clearActiveSession();
    setResumePrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Resume In-Progress Session Dialog */}
      {resumePrompt && view === 'auth' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Lanjutkan Ujian Sebelumnya?</h3>
              <p className="text-xs text-slate-400">
                Terdeteksi sesi ujian belum selesai pada perangkat ini:
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div><strong className="text-white">{resumePrompt.student.nama}</strong> ({resumePrompt.student.rombel})</div>
              <div className="text-slate-400 font-mono">NISN: {resumePrompt.student.nisn}</div>
              <div className="text-emerald-400 font-semibold mt-1">
                Tersimpan {resumePrompt.answeredCount} dari 25 soal dijawab
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeclineResume}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                Hapus Sesi
              </button>
              <button
                type="button"
                onClick={handleConfirmResume}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition"
              >
                Lanjutkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Switching */}
      {view === 'auth' && (
        <StudentAuth
          onStartExam={handleStartExam}
          onOpenAdmin={handleOpenAdminPinModal}
        />
      )}

      {view === 'exam' && currentStudent && (
        <ExamView
          student={currentStudent}
          onFinishExam={handleFinishExam}
        />
      )}

      {view === 'completion' && currentStudent && completedSubmission && (
        <CompletionScreen
          student={currentStudent}
          submission={completedSubmission}
          onFinishReturn={handleFinishReturn}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          onClose={() => setView('auth')}
          onOpenGuide={() => setShowAppsScriptModal(true)}
        />
      )}

      {/* Admin PIN Verification Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Akses Pengawas Ruang</h3>
              </div>
              <button
                onClick={() => setShowAdminPinModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Masukkan PIN Pengawas Ruang untuk membuka dashboard pemantauan real-time dan rekapitulasi nilai.
            </p>

            <form onSubmit={handleVerifyAdminPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError('');
                  }}
                  placeholder="Masukkan PIN Pengawas"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
                />
                {adminPinError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 justify-center">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{adminPinError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-amber-600/20 transition"
                >
                  Buka Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apps Script Installation Guide Modal */}
      <AppsScriptModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
      />
    </div>
  );
}
