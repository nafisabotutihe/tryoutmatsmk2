import React from 'react';
import { Student } from '../data/studentsData';
import { ExamSubmission } from '../types';
import { CheckCircle2, ShieldCheck, FileSpreadsheet, Lock, ArrowLeft } from 'lucide-react';

interface CompletionScreenProps {
  student: Student;
  submission: ExamSubmission;
  onFinishReturn: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  student,
  submission,
  onFinishReturn,
}) => {
  const isSynced = submission.syncStatus === 'synced';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Animated Badge */}
        <div className="mx-auto w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ujian Berhasil Dikumpulkan!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Terima kasih telah mengikuti Try Out TKA Matematika dengan tertib dan jujur.
          </p>
        </div>

        {/* Student Receipt Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Tanda Terima Ujian</span>
            <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TERVERIFIKASI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">NAMA SISWA:</span>
              <strong className="text-white">{student.nama}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ROMBEL:</span>
              <strong className="text-cyan-400">{student.rombel}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">NISN / NIPD:</span>
              <span className="font-mono text-slate-300">{student.nisn} / {student.nipd}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">WAKTU SELESAI:</span>
              <span className="font-mono text-slate-300">
                {new Date(submission.submittedAt).toLocaleTimeString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SOAL TERJAWAB:</span>
              <strong className="text-slate-200">{submission.answeredCount} dari 25 Soal</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DURASI PENGERJAAN:</span>
              <span className="text-slate-300">
                {Math.floor(submission.durationUsedSeconds / 60)}m {submission.durationUsedSeconds % 60}s
              </span>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 text-left ${
          isSynced 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            <FileSpreadsheet className={`w-5 h-5 ${isSynced ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="font-bold">
              {isSynced ? 'Tersimpan ke Google Spreadsheet' : 'Tersimpan Aman di Perangkat (Offline)'}
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isSynced 
                ? 'Seluruh lembar jawaban dan log pengawasan telah disinkronkan ke Google Spreadsheet panitia.'
                : 'Data tersimpan di perangkat dan akan otomatis disinkronkan saat terhubung ke Google Apps Script.'}
            </p>
          </div>
        </div>

        {/* Strict Confidentiality Notice: Requirement #8 (Siswa tidak bisa melihat jawaban akhirnya) */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5 text-slate-400 text-xs text-left flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-200 block mb-0.5">Kerahasiaan Kunci Jawaban &amp; Nilai:</strong>
            Sesuai regulasi Panitia CBT SMK Negeri 2 Gorontalo, kunci jawaban dan perolehan skor akhir bersifat rahasia dan langsung dialirkan ke Pengawas Ruang untuk rekapitulasi nilai.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onFinishReturn}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold rounded-xl text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Selesai &amp; Kembali ke Halaman Utama</span>
        </button>

        <p className="text-[10px] text-slate-500">
          Silakan letakkan perangkat HP Anda di atas meja dan tunggu aba-aba dari Pengawas Ruang.
        </p>
      </div>
    </div>
  );
};
