import React, { useState, useMemo } from 'react';
import { ROMBEL_LIST, Student, getStudentsByRombel } from '../data/studentsData';
import { StorageService } from '../services/storageService';
import { 
  GraduationCap, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  Maximize2, 
  Search, 
  UserCheck, 
  AlertTriangle
} from 'lucide-react';

interface StudentAuthProps {
  onStartExam: (student: Student) => void;
  onOpenAdmin: () => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({
  onStartExam,
  onOpenAdmin
}) => {
  const [selectedRombel, setSelectedRombel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [agreeRules, setAgreeRules] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter students based on selected Rombel
  const studentsInRombel = useMemo(() => {
    if (!selectedRombel) return [];
    return getStudentsByRombel(selectedRombel);
  }, [selectedRombel]);

  // Filtered by search if typed
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsInRombel;
    const q = searchQuery.toLowerCase();
    return studentsInRombel.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.nipd.includes(q)
    );
  }, [studentsInRombel, searchQuery]);

  // Check if chosen student has already submitted
  const existingSubmission = useMemo(() => {
    if (!selectedStudent) return null;
    return StorageService.getSubmissionByNisn(selectedStudent.nisn);
  }, [selectedStudent]);

  const handleSelectRombel = (rombel: string) => {
    setSelectedRombel(rombel);
    setSelectedStudent(null);
    setSearchQuery('');
    setErrorMessage('');
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setErrorMessage('');
  };

  const handleBegin = () => {
    if (!selectedRombel) {
      setErrorMessage('Silakan pilih Rombel terlebih dahulu.');
      return;
    }
    if (!selectedStudent) {
      setErrorMessage('Silakan pilih Nama Siswa sesuai identitas Anda.');
      return;
    }
    if (existingSubmission) {
      setErrorMessage('Anda sudah pernah menyelesaikan ujian ini. Duplikasi data tidak diperbolehkan.');
      return;
    }
    if (!agreeRules) {
      setErrorMessage('Anda harus menyetujui tata tertib dan sistem integritas ujian.');
      return;
    }

    // Try requesting fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }

    onStartExam(selectedStudent);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 font-sans">
      {/* Top Navbar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">SMK NEGERI 2 GORONTALO</h1>
            <p className="text-[11px] text-slate-400">CBT Try Out TKA Matematika 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAdmin}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pengawas</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-4 space-y-4">
        {/* Banner Title */}
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/30 border border-blue-500/20 rounded-2xl p-4 sm:p-5">
          <span className="inline-block px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-2">
            Portal Ujian Siswa (25 Soal • 90 Menit)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            CBT Try Out TKA Matematika SMK
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Data identitas siswa otomatis tersinkronisasi. Pastikan memilih Rombel dan Nama Anda dengan benar.
          </p>
        </div>

        {/* Step 1: Select Rombel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
            Pilih Rombel Saat Ini:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROMBEL_LIST.map((rombel) => {
              const isSelected = selectedRombel === rombel;
              return (
                <button
                  key={rombel}
                  type="button"
                  onClick={() => handleSelectRombel(rombel)}
                  className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{rombel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Student Name */}
        {selectedRombel && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg animate-in fade-in duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                Pilih Nama Siswa ({studentsInRombel.length} Siswa di {selectedRombel}):
              </span>
              {selectedStudent && (
                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Terpilih
                </span>
              )}
            </label>

            {/* Search Input for fast selection */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NISN untuk mencari..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Student List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.nisn === s.nisn;
                  const alreadyDone = StorageService.hasStudentSubmitted(s.nisn);
                  return (
                    <button
                      key={s.nisn}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                          : alreadyDone
                          ? 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                          : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <span>{s.nama}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                            {s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          NISN: <span className="font-mono text-slate-300">{s.nisn}</span> • NIPD: <span className="font-mono text-slate-300">{s.nipd}</span>
                        </div>
                      </div>

                      {alreadyDone ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-medium shrink-0">
                          Sudah Selesai
                        </span>
                      ) : isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Tidak ada nama siswa yang cocok dengan pencarian "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Student Card & Anti-Duplicate Warning */}
        {selectedStudent && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {existingSubmission ? (
              <div className="bg-rose-950/50 border border-rose-600/60 rounded-2xl p-4 text-rose-200 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Validasi Duplikasi: Anda Sudah Menyelesaikan Ujian</span>
                </div>
                <p>
                  Siswa atas nama <strong className="text-white">{selectedStudent.nama}</strong> (NISN: {selectedStudent.nisn}) telah menyelesaikan dan mengirimkan jawaban ujian pada{' '}
                  <span className="font-semibold text-rose-200">
                    {new Date(existingSubmission.submittedAt).toLocaleString('id-ID')}
                  </span>.
                </p>
                <p className="text-[11px] text-rose-300/90">
                  Sistem keamanan mencegah pengisian ganda agar data penilaian tetap valid. Apabila Anda mengalami masalah jaringan atau kendala lainnya, harap segera melapor ke Pengawas Ruang agar dapat diatur ulang dari Dashboard Pengawas.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Konfirmasi Identitas Siswa
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded font-mono text-[11px]">
                    Valid &amp; Siap Ujian
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">NAMA LENGKAP:</span>
                    <strong className="text-white text-sm">{selectedStudent.nama}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ROMBEL / KELAS:</span>
                    <strong className="text-cyan-400 text-sm">{selectedStudent.rombel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NISN:</span>
                    <strong className="text-slate-200 font-mono text-xs">{selectedStudent.nisn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NIPD:</span>
                    <strong className="text-slate-200 font-mono text-xs">{selectedStudent.nipd}</strong>
                  </div>
                </div>

                {/* Anti-cheat guidelines */}
                <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-200/90 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    Ketentuan Sistem Keamanan CBT (Anti-Kecurangan):
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                    <li>Aplikasi otomatis mengunci dalam mode <strong>Layar Penuh (Fullscreen)</strong>.</li>
                    <li>Membuka tab baru, pindah aplikasi, atau merekam layar (screen recording) akan <strong>tercatat otomatis</strong> dan dilaporkan langsung ke pengawas serta Google Spreadsheet.</li>
                    <li>Jawaban tersimpan otomatis setiap detik secara aman di perangkat dan server.</li>
                  </ul>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Saya menyatakan identitas di atas adalah benar milik saya, dan saya bersedia mematuhi seluruh tata tertib ujian tanpa melakukan kecurangan.
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-600/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Start Button */}
        <button
          type="button"
          disabled={!selectedStudent || !!existingSubmission || !agreeRules}
          onClick={handleBegin}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] ${
            !selectedStudent || !!existingSubmission || !agreeRules
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
          <span>Masuk &amp; Mulai Ujian (Mode Layar Penuh)</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
        <span>&copy; 2026 SMK Negeri 2 Gorontalo. All rights reserved.</span>
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          Dioptimalkan untuk Layar HP &amp; Komputer
        </span>
      </footer>
    </div>
  );
};
