import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, X, FileSpreadsheet } from 'lucide-react';
import { APPS_SCRIPT_CODE } from '../services/appsScriptTemplate';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Panduan Otomasi Google Spreadsheet & Apps Script</h3>
              <p className="text-xs text-slate-400">Sinkronisasi otomatis hasil ujian & log kecurangan untuk 300+ peserta bersamaan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Steps */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Langkah-Langkah Pemasangan (Estimasi 3 Menit):
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-2 leading-relaxed">
              <li>
                Buka <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium inline-flex items-center gap-1">Google Sheets <ExternalLink className="w-3 h-3" /></a> baru di Google Drive Anda.
              </li>
              <li>Beri nama spreadsheet, contoh: <strong className="text-white">CBT TKA Matematika SMKN 2 Gorontalo</strong>.</li>
              <li>Klik menu <strong className="text-white">Ekstensi (Extensions)</strong> &rarr; <strong className="text-white">Apps Script</strong>.</li>
              <li>Hapus semua tulisan di editor kode Apps Script, lalu klik tombol <strong className="text-emerald-400">"Salin Seluruh Kode Script"</strong> di bawah ini dan Paste ke editor tersebut.</li>
              <li>Klik tombol ikon <strong className="text-white">Simpan (Save / Ctrl+S)</strong>.</li>
              <li>
                Klik tombol biru <strong className="text-white">Terapkan (Deploy)</strong> di kanan atas &rarr; pilih <strong className="text-white">Penerapan Baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis: <strong className="text-white">Aplikasi Web (Web app)</strong>:
                <ul className="list-disc list-inside pl-4 mt-1 text-xs text-slate-400 space-y-1">
                  <li>Deskripsi: <span className="text-slate-200">CBT Handler Gorontalo</span></li>
                  <li>Jalankan sebagai: <strong className="text-emerald-300">Saya (Me)</strong></li>
                  <li>Yang memiliki akses: <strong className="text-amber-300">Siapa saja (Anyone)</strong> <span className="text-rose-400">*Wajib agar siswa dapat mengirim data</span></li>
                </ul>
              </li>
              <li>Klik <strong className="text-white">Terapkan (Deploy)</strong>, lalu klik <em>Beri Akses (Authorize)</em> &rarr; Pilih akun Google &rarr; Klik <em>Lanjutan (Advanced)</em> &rarr; <em>Buka CBT... (tidak aman)</em> &rarr; <em>Izinkan</em>.</li>
              <li>Salin <strong>URL Aplikasi Web</strong> (berakhiran <code>/exec</code>), lalu masukkan ke kolom Pengaturan di Dashboard Pengawas ini.</li>
            </ol>
          </div>

          {/* Code box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Kode Google Apps Script (Dengan ScriptLock Concurrency Guard)</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Berhasil Disalin!' : 'Salin Seluruh Kode Script'}
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 max-h-72 overflow-y-auto select-all leading-relaxed">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>

          {/* Concurrency info */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl text-xs text-cyan-200">
            <strong className="block text-cyan-100 text-sm mb-1 font-semibold">Keamanan Beban 300 Siswa Sekaligus:</strong>
            Kode script di atas telah dilengkapi dengan <code>LockService.getScriptLock()</code> dan antrean sinkronisasi bertahap. Ketika 300 siswa mengumpulkan lembar jawaban pada menit yang sama, Google Spreadsheet akan memproses antrean satu per satu secara terkunci tanpa tabrakan baris atau data korup.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
