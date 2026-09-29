import React, { useState, useEffect, useMemo } from 'react';
import { STUDENTS_DATA, ROMBEL_LIST, Student } from '../data/studentsData';
import { StorageService } from '../services/storageService';
import { SheetService } from '../services/sheetService';
import { ExamSubmission, LiveProctorHeartbeat, ViolationLog } from '../types';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Award, 
  Search, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  Smartphone, 
  ExternalLink, 
  ArrowLeft, 
  Filter, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
  KeyRound,
  Lock,
  Copy,
  Sparkles,
  Edit3
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onOpenGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onOpenGuide }) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'deviceLogs' | 'sheets' | 'export'>('monitoring');
  const [selectedRombel, setSelectedRombel] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUBMITTED' | 'NOT_STARTED' | 'VIOLATION' | 'VIOLATION_3PLUS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local storage state
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [pendingQueue, setPendingQueue] = useState<ExamSubmission[]>([]);
  const [heartbeats, setHeartbeats] = useState<Record<string, LiveProctorHeartbeat>>({});
  const [deviceLogs, setDeviceLogs] = useState<Array<{ at: string; nisn: string; nama: string; rombel: string; action: string; meta?: string }>>([]);
  
  // Spreadsheet config state
  const [scriptUrl, setScriptUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string>('');
  
  // Custom Admin PIN state
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string>('');

  // Exam Token state
  const [examToken, setExamToken] = useState<string>(StorageService.getExamToken());
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [isEditingToken, setIsEditingToken] = useState<boolean>(false);
  const [customTokenInput, setCustomTokenInput] = useState<string>('');
  const [tokenFeedbackMsg, setTokenFeedbackMsg] = useState<string>('');

  // Spreadsheet download sync state
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [fetchSheetMsg, setFetchSheetMsg] = useState<{ success?: boolean; text: string } | null>(null);

  // Selected student for detail modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{
    student: Student;
    submission?: ExamSubmission;
    heartbeat?: LiveProctorHeartbeat;
  } | null>(null);

  // Load data
  const refreshData = () => {
    setSubmissions(StorageService.getSubmissions());
    setPendingQueue(StorageService.getPendingQueue());
    setHeartbeats(StorageService.getHeartbeats());
    setDeviceLogs(StorageService.getDeviceLogs());
    setScriptUrl(StorageService.getAppsScriptUrl());
    setExamToken(StorageService.getExamToken());
  };

  // Unduh & sinkronkan data hasil ujian dari Google Spreadsheet
  const handleSyncFromSpreadsheet = async (isInitial = false) => {
    if (isFetchingSheet) return;
    setIsFetchingSheet(true);
    if (!isInitial) {
      setFetchSheetMsg({ text: 'Menghubungkan ke Google Spreadsheet & mengunduh data...' });
    }

    const res = await SheetService.fetchDataFromSpreadsheet();
    setIsFetchingSheet(false);
    refreshData();

    if (!isInitial || (res.success && (res.submissionsCount || 0) > 0)) {
      setFetchSheetMsg({
        success: res.success,
        text: res.message
      });
      setTimeout(() => setFetchSheetMsg(null), 6000);
    }
  };

  // Sinkron otomatis pada dashboard pengawas HANYA saat aplikasi pertama kali ter-load
  useEffect(() => {
    refreshData();
    handleSyncFromSpreadsheet(true);
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    return STUDENTS_DATA.filter((student) => {
      // Rombel filter
      if (selectedRombel !== 'ALL' && student.rombel !== selectedRombel) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.nama.toLowerCase().includes(q);
        const matchNisn = student.nisn.includes(q);
        const matchNipd = student.nipd.includes(q);
        if (!matchName && !matchNisn && !matchNipd) return false;
      }

      const sub = submissions.find((s) => s.nisn === student.nisn);
      const hb = heartbeats[student.nisn];
      const isSubmitted = !!sub;
      const isActive = !isSubmitted && !!hb;
      const isNotStarted = !isSubmitted && !hb;
      const violationCount = sub ? sub.violationCount : (hb ? hb.violationCount : 0);
      const hasViolation = violationCount > 0;
      const has3PlusViolation = violationCount >= 3;

      // Status filter
      if (statusFilter === 'SUBMITTED' && !isSubmitted) return false;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'NOT_STARTED' && !isNotStarted) return false;
      if (statusFilter === 'VIOLATION' && !hasViolation) return false;
      if (statusFilter === 'VIOLATION_3PLUS' && !has3PlusViolation) return false;

      return true;
    });
  }, [selectedRombel, searchQuery, statusFilter, submissions, heartbeats]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalStudents = STUDENTS_DATA.length;
    const submittedCount = submissions.length;
    
    // Active are those with heartbeat within last 5 minutes not submitted
    const activeCount = Object.values(heartbeats).filter(
      (h) => !submissions.some((s) => s.nisn === h.nisn)
    ).length;

    const notStartedCount = Math.max(0, totalStudents - submittedCount - activeCount);
    
    // Total violations across submitted and active
    const violationTotal = submissions.reduce((sum, s) => sum + s.violationCount, 0) +
      Object.values(heartbeats)
        .filter((h) => !submissions.some((s) => s.nisn === h.nisn))
        .reduce((sum, h) => sum + (h.violationCount || 0), 0);

    const studentsWith3PlusViolations = STUDENTS_DATA.filter((s) => {
      const sub = submissions.find((subItem) => subItem.nisn === s.nisn);
      const hb = heartbeats[s.nisn];
      const count = sub ? sub.violationCount : (hb ? hb.violationCount : 0);
      return count >= 3;
    }).length;

    const averageScore = submittedCount > 0
      ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submittedCount)
      : 0;

    return {
      totalStudents,
      submittedCount,
      activeCount,
      notStartedCount,
      violationTotal,
      studentsWith3PlusViolations,
      averageScore
    };
  }, [submissions, heartbeats]);

  // Save Apps Script URL
  const handleSaveUrl = () => {
    StorageService.setAppsScriptUrl(scriptUrl);
    setSyncSuccessMsg('URL Google Apps Script berhasil disimpan!');
    setTimeout(() => setSyncSuccessMsg(''), 3000);
  };

  // Test Connection
  const handleTestConnection = async () => {
    setTestResult({ loading: true });
    const res = await SheetService.testConnection(scriptUrl);
    setTestResult({
      loading: false,
      success: res.success,
      message: res.message
    });
  };

  // Flush Queue
  const handleFlushQueue = async () => {
    setIsSyncing(true);
    const res = await SheetService.flushPendingQueue();
    setIsSyncing(false);
    refreshData();
    setSyncSuccessMsg(`Sinkronisasi selesai: ${res.succeeded} dari ${res.processed} antrean berhasil dikirim.`);
    setTimeout(() => setSyncSuccessMsg(''), 5000);
  };

  // Update Admin PIN
  const handleUpdatePin = () => {
    if (!newPin.trim()) return;
    StorageService.setAdminPin(newPin.trim());
    setPinChangeMsg('PIN Pengawas berhasil diperbarui!');
    setNewPin('');
    setTimeout(() => setPinChangeMsg(''), 4000);
  };

  // Exam Token Actions
  const handleResetRandomToken = () => {
    if (confirm('Yakin ingin mereset/mengacak Token Ujian baru? Siswa yang belum login harus memasukkan token baru ini.')) {
      const nextToken = StorageService.generateRandomToken();
      setExamToken(nextToken);
      setTokenFeedbackMsg(`Token ujian berhasil diacak ke: ${nextToken}`);
      setTimeout(() => setTokenFeedbackMsg(''), 5000);
    }
  };

  const handleSaveCustomToken = () => {
    if (!customTokenInput.trim()) return;
    const nextToken = customTokenInput.trim().toUpperCase();
    StorageService.setExamToken(nextToken);
    setExamToken(nextToken);
    setIsEditingToken(false);
    setCustomTokenInput('');
    setTokenFeedbackMsg(`Token manual berhasil disimpan: ${nextToken}`);
    setTimeout(() => setTokenFeedbackMsg(''), 5000);
  };

  const handleCopyToken = () => {
    try {
      navigator.clipboard.writeText(examToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    } catch {
      // fallback
    }
  };

  // Admin Reset Student
  const handleResetStudent = (student: Student) => {
    if (confirm(`Yakin ingin mereset ujian siswa ${student.nama} (${student.nisn})? Jawaban dan status selesai siswa ini akan dihapus sehingga dapat mengulang ujian.`)) {
      StorageService.adminResetStudent(student.nisn);
      refreshData();
      setSelectedStudentDetail(null);
    }
  };

  // Export CSV Rekap Nilai
  const handleExportNilaiCSV = () => {
    const headers = [
      'No', 'NISN', 'NIPD', 'Nama Siswa', 'Rombel', 'JK',
      'Status Ujian', 'Nilai (0-100)', 'Poin Mentah', 'Total Dijawab',
      'Jumlah Pelanggaran', 'Waktu Pengumpulan', 'Status Sinkron'
    ];

    const rows = STUDENTS_DATA.map((s, index) => {
      const sub = submissions.find((item) => item.nisn === s.nisn);
      const hb = heartbeats[s.nisn];
      let status = 'Belum Mulai';
      if (sub) status = 'Selesai';
      else if (hb) status = 'Sedang Mengerjakan';

      return [
        index + 1,
        `'${s.nisn}`,
        `'${s.nipd}`,
        `"${s.nama.replace(/"/g, '""')}"`,
        s.rombel,
        s.jk,
        status,
        sub ? sub.score : (hb ? `Progres: ${hb.answeredCount}/25` : '-'),
        sub ? sub.rawEarned : '-',
        sub ? sub.answeredCount : (hb ? hb.answeredCount : 0),
        sub ? sub.violationCount : (hb ? hb.violationCount : 0),
        sub ? new Date(sub.submittedAt).toLocaleString('id-ID') : '-',
        sub ? sub.syncStatus : '-'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_CBT_TKA_Gorontalo_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV Log Pelanggaran
  const handleExportPelanggaranCSV = () => {
    const headers = ['Waktu', 'NISN', 'Nama Siswa', 'Rombel', 'Jenis Pelanggaran', 'Alasan'];
    const rows: string[][] = [];

    submissions.forEach((sub) => {
      sub.violations.forEach((v) => {
        rows.push([
          new Date(v.at).toLocaleString('id-ID'),
          `'${sub.nisn}`,
          `"${sub.nama.replace(/"/g, '""')}"`,
          sub.rombel,
          v.type,
          `"${v.reason.replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Pelanggaran_CBT_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Kembali ke Layar Siswa"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Dashboard Pengawas &amp; Administrator CBT</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-mono">
                  Live Real-Time
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                SMK Negeri 2 Gorontalo • Monitoring 294 Peserta Didik
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Tombol Sinkronisasi Unduh Data Dari Spreadsheet */}
            <button
              onClick={() => handleSyncFromSpreadsheet(false)}
              disabled={isFetchingSheet}
              className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Unduh dan sinkronkan data jawaban peserta langsung dari Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingSheet ? 'Mengunduh...' : 'Sinkron Dari Spreadsheet'}</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Panduan Apps Script</span>
            </button>

            <button
              onClick={refreshData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              title="Perbarui Data Lokal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Tutup Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Notifikasi Sinkronisasi Spreadsheet */}
        {fetchSheetMsg && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border animate-in fade-in duration-200 shadow-xl ${
            fetchSheetMsg.success
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {fetchSheetMsg.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">{fetchSheetMsg.text}</span>
            </div>
            <button
              onClick={() => setFetchSheetMsg(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Token Management Banner (Pengawas Ruang) */}
        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Token Ujian Aktif (Ruang Ujian)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    AKTIF
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Siswa wajib memasukkan token ini saat membuka lembar ujian. Token dapat direset atau diganti sewaktu-waktu.
                </p>
              </div>
            </div>
            {tokenFeedbackMsg && (
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>{tokenFeedbackMsg}</span>
              </div>
            )}
          </div>

          {/* Token Display & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {isEditingToken ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={customTokenInput}
                  onChange={(e) => setCustomTokenInput(e.target.value.toUpperCase())}
                  placeholder="Ketik token baru"
                  maxLength={16}
                  className="px-3.5 py-2 bg-slate-950 border border-blue-500 rounded-xl text-sm font-mono font-bold tracking-widest text-white uppercase focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCustomToken}
                  disabled={!customTokenInput.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingToken(false);
                    setCustomTokenInput('');
                  }}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div
                  onClick={handleCopyToken}
                  title="Klik untuk menyalin token ujian"
                  className="cursor-pointer group flex items-center gap-3 px-4 py-2.5 bg-slate-950 border border-amber-500/50 hover:border-amber-400 rounded-xl shadow-inner transition active:scale-95"
                >
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TOKEN:</span>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-amber-300">
                    {examToken}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded text-slate-400 group-hover:text-amber-300 transition"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetRandomToken}
                  className="px-3.5 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Acak dan buat token baru secara otomatis"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Acak / Reset Token</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingToken(true);
                    setCustomTokenInput(examToken);
                  }}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Ubah token secara manual sesuai keinginan"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Ubah Manual</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Peserta */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Siswa</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalStudents}</div>
            <div className="text-[10px] text-slate-400 mt-1">11 Rombel Terdaftar</div>
          </div>

          {/* Card 2: Sedang Mengerjakan */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Sedang Aktif</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400">{stats.activeCount}</div>
            <div className="text-[10px] text-cyan-300/80 mt-1">Heartbeat aktif</div>
          </div>

          {/* Card 3: Selesai */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Sudah Selesai</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{stats.submittedCount}</div>
            <div className="text-[10px] text-emerald-300/80 mt-1">Lembar terkumpul</div>
          </div>

          {/* Card 4: Belum Mulai */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Belum Mulai</span>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-300">{stats.notStartedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Belum login</div>
          </div>

          {/* Card 5: Pelanggaran */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pelanggaran</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{stats.violationTotal}</div>
            <div className="text-[10px] text-rose-300/80 mt-1">
              {stats.studentsWith3PlusViolations > 0 ? (
                <span className="text-rose-400 font-bold">
                  {stats.studentsWith3PlusViolations} siswa ≥ 3x (Waspada)
                </span>
              ) : (
                'Insiden tercatat'
              )}
            </div>
          </div>

          {/* Card 6: Rata-rata Nilai (Admin Only) */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Rerata Nilai</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.averageScore}</div>
            <div className="text-[10px] text-amber-300/80 mt-1">Khusus Pengawas</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'monitoring'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Monitoring Siswa ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deviceLogs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'deviceLogs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Log Aktivitas Perangkat</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'sheets'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Integrasi Spreadsheet</span>
            {pendingQueue.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                {pendingQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor &amp; Rekap</span>
          </button>
        </div>

        {/* TAB 1: MONITORING REAL-TIME SISWA */}
        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nama, NISN, atau NIPD..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Rombel Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Rombel:</span>
                <select
                  value={selectedRombel}
                  onChange={(e) => setSelectedRombel(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Rombel (11 Rombel)</option>
                  {ROMBEL_LIST.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Sedang Mengerjakan</option>
                  <option value="SUBMITTED">Sudah Selesai</option>
                  <option value="NOT_STARTED">Belum Mulai</option>
                  <option value="VIOLATION">Ada Pelanggaran</option>
                  <option value="VIOLATION_3PLUS">🚨 Pelanggaran ≥ 3x (Waspada)</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-850 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Identitas Siswa</th>
                      <th className="p-3">Rombel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Progres Soal</th>
                      <th className="p-3 text-center">Nilai (Guru)</th>
                      <th className="p-3 text-center">Pelanggaran</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s, idx) => {
                        const sub = submissions.find((item) => item.nisn === s.nisn);
                        const hb = heartbeats[s.nisn];
                        const isSubmitted = !!sub;
                        const isActive = !isSubmitted && !!hb;

                        const answered = sub ? sub.answeredCount : (hb ? hb.answeredCount : 0);
                        const progressPct = Math.round((answered / 25) * 100);
                        const violationsCount = sub ? sub.violationCount : (hb ? hb.violationCount : 0);
                        const isHighViolation = violationsCount >= 3;

                        return (
                          <tr
                            key={s.nisn}
                            className={`transition ${
                              isHighViolation
                                ? 'bg-rose-950/25 border-l-4 border-l-rose-500 hover:bg-rose-950/40'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{s.nama}</span>
                                {isHighViolation && (
                                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9px] font-bold uppercase animate-pulse">
                                    ≥3x
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                NISN: {s.nisn} • NIPD: {s.nipd} ({s.jk})
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                                {s.rombel}
                              </span>
                            </td>
                            <td className="p-3">
                              {isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                </span>
                              ) : isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold animate-pulse">
                                  <Clock className="w-3.5 h-3.5" /> Mengerjakan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs">
                                  Belum Mulai
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-slate-300 font-medium">{answered}/25</span>
                                  <span className="text-slate-400 font-mono">{progressPct}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isSubmitted ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {sub ? (
                                <span className="font-bold text-amber-400 text-sm font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {sub.score}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isHighViolation ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-600/30 text-rose-200 border border-rose-500 text-xs font-black animate-pulse shadow-md shadow-rose-950"
                                  title="Peringatan Pengawas: Siswa ini telah melanggar 3 kali atau lebih! Soal tetap dapat dikerjakan siswa."
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>{violationsCount}x (WASPADA)</span>
                                </span>
                              ) : violationsCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  {violationsCount}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">0</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setSelectedStudentDetail({ student: s, submission: sub, heartbeat: hb })}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                title="Lihat Detail & Log Siswa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Tidak ditemukan siswa dengan kriteria filter saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOG AKTIVITAS & PERANGKAT (REQUIREMENT #10) */}
        {activeTab === 'deviceLogs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">Log Aktivitas &amp; Integritas Perangkat Real-Time</h3>
                <p className="text-xs text-slate-400">
                  Pantau percobaan pindah tab, buka aplikasi lain, keluar fullscreen, atau rekam layar
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
                {deviceLogs.length} Aktivitas Terekam
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {deviceLogs.length > 0 ? (
                deviceLogs.map((log, index) => {
                  const isViolation = log.action.includes('PELANGGARAN');
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition ${
                        isViolation
                          ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                        {isViolation ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs">{log.nama} ({log.rombel})</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(log.at).toLocaleTimeString('id-ID')}
                          </span>
                        </div>
                        <p className="mt-0.5 font-medium">{log.action}</p>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          NISN: {log.nisn} {log.meta ? `• Tipe: ${log.meta}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Belum ada log aktivitas perangkat yang terekam.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INTEGRASI GOOGLE SPREADSHEET (REQUIREMENT #1, #5) */}
        {activeTab === 'sheets' && (
          <div className="space-y-5">
            {/* Guide Card */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Integrasi Otomatis Google Spreadsheet</h3>
                    <p className="text-xs text-slate-300">
                      Mendukung 300+ pengumpulan bersamaan dengan ScriptLock tanpa hambatan
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenGuide}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Buka Panduan &amp; Salin Kode</span>
                </button>
              </div>
            </div>

            {/* Config & URL Input */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                URL Google Apps Script Web App (Berakhiran /exec):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={handleSaveUrl}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
                >
                  Simpan URL
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testResult.loading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition shrink-0"
                >
                  {testResult.loading ? 'Menguji...' : 'Test Koneksi'}
                </button>
              </div>

              {syncSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              {testResult.message && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                }`}>
                  {testResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Unduh Data Dari Google Spreadsheet */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Sinkronisasi Unduh Data Dari Spreadsheet</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tarik dan unduh seluruh data lembar jawaban siswa yang tersimpan di Google Spreadsheet ke dashboard pengawas ini.
                  </p>
                </div>
                <button
                  onClick={() => handleSyncFromSpreadsheet(false)}
                  disabled={isFetchingSheet}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                  <span>{isFetchingSheet ? 'Sedang Mengunduh...' : 'Unduh Data Dari Spreadsheet'}</span>
                </button>
              </div>
            </div>

            {/* Offline Queue Handler */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Antrean Sinkronisasi (Offline Buffer)</h4>
                  <p className="text-xs text-slate-400">
                    Jika ada siswa yang mengalami kendala sinyal saat submit, data tertampung di sini dan dapat disinkronkan ulang.
                  </p>
                </div>
                <button
                  onClick={handleFlushQueue}
                  disabled={isSyncing || pendingQueue.length === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    pendingQueue.length === 0
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Kirim Ulang Semua ({pendingQueue.length})</span>
                </button>
              </div>

              {pendingQueue.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingQueue.map((item) => (
                    <div key={item.nisn} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-white">{item.nama}</strong> ({item.rombel})
                        <div className="text-[11px] text-slate-400 font-mono">NISN: {item.nisn}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-medium">
                        Menunggu Dikirim
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400">
                  Semua data pengumpulan siswa telah tersinkronkan dengan sempurna. Tidak ada antrean tertunda.
                </div>
              )}
            </div>

            {/* Pengaturan Keamanan PIN Pengawas */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Pengaturan Keamanan Akses Pengawas</h4>
                  <p className="text-xs text-slate-400">
                    Ubah PIN Pengawas Ruang agar hanya pihak berwenang yang dapat membuka dashboard ini.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={handleUpdatePin}
                  disabled={!newPin.trim()}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shrink-0 ${
                    !newPin.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Perbarui PIN</span>
                </button>
              </div>

              {pinChangeMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{pinChangeMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EKSPOR & REKAP */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Rekap Nilai CSV */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Ekspor Rekapitulasi Nilai Siswa</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Unduh seluruh daftar 294 siswa beserta skor perolehan, jumlah jawaban benar, dan waktu selesai dalam format Excel/CSV.
                </p>
              </div>
              <button
                onClick={handleExportNilaiCSV}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Rekap Nilai (CSV / Excel)</span>
              </button>
            </div>

            {/* Card 2: Log Pelanggaran CSV */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Ekspor Audit Log Kecurangan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Unduh rincian bukti pelanggaran (pindah tab, keluar layar penuh, devtools, split screen) lengkap dengan timestamp kejadian.
                </p>
              </div>
              <button
                onClick={handleExportPelanggaranCSV}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Log Pelanggaran (CSV)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Student Detail Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">{selectedStudentDetail.student.nama}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedStudentDetail.student.rombel} • NISN: {selectedStudentDetail.student.nisn} • NIPD: {selectedStudentDetail.student.nipd}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Status Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">STATUS PENGERJAAN:</span>
                <strong className="text-white text-sm">
                  {selectedStudentDetail.submission
                    ? 'Selesai Dikumpulkan'
                    : selectedStudentDetail.heartbeat
                    ? 'Sedang Aktif Mengerjakan'
                    : 'Belum Mulai'}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SKOR AKHIR (0-100):</span>
                <strong className="text-amber-400 text-sm font-mono">
                  {selectedStudentDetail.submission ? `${selectedStudentDetail.submission.score} / 100` : '-'}
                </strong>
              </div>
            </div>

            {/* High Violations Alert Notice */}
            {((selectedStudentDetail.submission?.violationCount || selectedStudentDetail.heartbeat?.violationCount || 0) >= 3) && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-500 rounded-2xl text-rose-200 text-xs flex items-start gap-3 shadow-lg animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-200 uppercase tracking-wide">
                    Peringatan Pengawas: Terdeteksi {selectedStudentDetail.submission?.violationCount || selectedStudentDetail.heartbeat?.violationCount || 0}x Pelanggaran
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    Sesuai ketentuan, soal ujian siswa <strong>tidak dikunci</strong> agar siswa tetap dapat menyelesaikan ujian. Seluruh log kejadian di bawah ini tervalidasi real-time untuk pertimbangan berita acara pengawas.
                  </p>
                </div>
              </div>
            )}

            {/* Violations List */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Rincian Pelanggaran Tercatat (
                {selectedStudentDetail.submission?.violations?.length || selectedStudentDetail.heartbeat?.violationCount || 0}
                ):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedStudentDetail.submission?.violations && selectedStudentDetail.submission.violations.length > 0 ? (
                  selectedStudentDetail.submission.violations.map((v, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-600/40 text-xs text-rose-200 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div>{v.reason}</div>
                        <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                          {new Date(v.at).toLocaleTimeString('id-ID')} ({v.type})
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    Tidak ada pelanggaran yang terekam pada sesi ujian siswa ini.
                  </div>
                )}
              </div>
            </div>

            {/* Reset Retake Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Reset memungkinkan siswa mengulang ujian jika terjadi kendala.
              </span>
              <button
                type="button"
                onClick={() => handleResetStudent(selectedStudentDetail.student)}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Ujian Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
