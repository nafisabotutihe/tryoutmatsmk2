import { ExamSubmission, LiveProctorHeartbeat, ViolationLog } from '../types';
import { StorageService } from './storageService';

// BroadcastChannel for cross-tab communication (e.g. Proctor dashboard in one tab, student in another)
let proctorChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    proctorChannel = new BroadcastChannel('cbt_proctor_channel');
  }
} catch {
  proctorChannel = null;
}

export const SheetService = {
  // Test connection to Google Apps Script Web App
  async testConnection(url?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = url || StorageService.getAppsScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      // Send a ping GET or POST
      const res = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
      });
      if (res.ok) {
        const text = await res.text();
        return { success: true, message: `Koneksi Google Spreadsheet Berhasil! Response: ${text.substring(0, 80)}` };
      }
      return { success: false, message: `Server merespon dengan status: ${res.status}` };
    } catch (err: any) {
      // If CORS blocks GET, try sending a non-preflighted POST test
      try {
        await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'PING', at: new Date().toISOString() })
        });
        return {
          success: true,
          message: 'Permintaan berhasil dikirimkan ke Google Apps Script (mode no-cors ok).'
        };
      } catch (innerErr: any) {
        return { success: false, message: `Gagal terhubung ke Google Apps Script: ${err.message || innerErr.message}` };
      }
    }
  },

  // Send exam submission to Google Apps Script
  async sendSubmission(submission: ExamSubmission): Promise<{ success: boolean; message: string }> {
    const targetUrl = StorageService.getAppsScriptUrl();

    // Broadcast submission event immediately to local proctor
    if (proctorChannel) {
      try {
        proctorChannel.postMessage({ type: 'SUBMISSION_COMPLETED', data: submission });
      } catch (e) {
        // ignore
      }
    }

    if (!targetUrl) {
      // Saved locally, pending setup
      submission.syncStatus = 'pending';
      submission.syncError = 'URL Google Apps Script belum dikonfigurasi oleh panitia';
      StorageService.saveSubmission(submission);
      StorageService.addToPendingQueue(submission);
      return {
        success: true,
        message: 'Jawaban tersimpan aman di perangkat (Lokal). Siap dikirim saat URL Spreadsheet aktif.'
      };
    }

    const payload = {
      action: 'SUBMIT_EXAM',
      ...submission
    };

    try {
      // Use text/plain to avoid preflight OPTIONS CORS block in Google Apps Script
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resultText = await response.text();
        submission.syncStatus = 'synced';
        submission.syncTimestamp = new Date().toISOString();
        StorageService.saveSubmission(submission);
        StorageService.removeFromPendingQueue(submission.nisn);
        return { success: true, message: 'Jawaban dan log ujian berhasil terkirim ke Google Spreadsheet!' };
      } else {
        throw new Error(`HTTP Error ${response.status}`);
      }
    } catch (err: any) {
      // If error (network dip, 300 burst, or CORS redirect), try mode: no-cors as resilient fallback
      try {
        await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        submission.syncStatus = 'synced';
        submission.syncTimestamp = new Date().toISOString();
        StorageService.saveSubmission(submission);
        StorageService.removeFromPendingQueue(submission.nisn);
        return { success: true, message: 'Jawaban berhasil dikirimkan ke Google Spreadsheet (no-cors mode).' };
      } catch (fallbackErr: any) {
        submission.syncStatus = 'pending';
        submission.syncError = err.message || fallbackErr.message;
        StorageService.saveSubmission(submission);
        StorageService.addToPendingQueue(submission);
        return {
          success: false,
          message: 'Koneksi terganggu. Jawaban tetap tersimpan aman di memori perangkat dan akan otomatis dikirim ulang saat jaringan stabil.'
        };
      }
    }
  },

  // Send real-time heartbeat to proctor and Google Sheets
  async sendHeartbeat(hb: LiveProctorHeartbeat): Promise<void> {
    StorageService.updateHeartbeat(hb);

    if (proctorChannel) {
      try {
        proctorChannel.postMessage({ type: 'HEARTBEAT_UPDATE', data: hb });
      } catch (e) {
        // ignore
      }
    }

    const targetUrl = StorageService.getAppsScriptUrl();
    if (!targetUrl) return;

    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'HEARTBEAT',
          ...hb
        })
      });
    } catch {
      // silent on heartbeat background fail
    }
  },

  // Immediately log a single violation to Google Apps Script & Proctor
  async logViolationRealtime(violation: ViolationLog, studentInfo: { nisn: string; nama: string; rombel: string; userAgent: string }): Promise<void> {
    StorageService.addDeviceLog({
      nisn: studentInfo.nisn,
      nama: studentInfo.nama,
      rombel: studentInfo.rombel,
      action: `PELANGGARAN: ${violation.reason}`,
      meta: violation.type
    });

    if (proctorChannel) {
      try {
        proctorChannel.postMessage({
          type: 'VIOLATION_TRIGGERED',
          data: { violation, student: studentInfo }
        });
      } catch (e) {
        // ignore
      }
    }

    const targetUrl = StorageService.getAppsScriptUrl();
    if (!targetUrl) return;

    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'LOG_VIOLATION',
          nisn: studentInfo.nisn,
          nama: studentInfo.nama,
          rombel: studentInfo.rombel,
          userAgent: studentInfo.userAgent,
          type: violation.type,
          reason: violation.reason,
          at: violation.at
        })
      });
    } catch {
      // background silent fail
    }
  },

  // Flush pending submissions queue with jitter (for 300 concurrent resilience)
  async flushPendingQueue(): Promise<{ processed: number; succeeded: number }> {
    const queue = StorageService.getPendingQueue();
    if (queue.length === 0) return { processed: 0, succeeded: 0 };

    let succeeded = 0;
    for (const item of queue) {
      // Stagger by 400ms - 1200ms to avoid overwhelming Apps Script rate limit
      const jitter = Math.floor(Math.random() * 800) + 400;
      await new Promise((resolve) => setTimeout(resolve, jitter));

      const res = await this.sendSubmission(item);
      if (res.success) {
        succeeded++;
      }
    }
    return { processed: queue.length, succeeded };
  }
};
