export const APPS_SCRIPT_CODE = `/**
 * ==========================================================================
 * CBT TRY OUT TKA MATEMATIKA SMK NEGERI 2 GORONTALO
 * GOOGLE APPS SCRIPT HANDLER (CONCURRENCY-SAFE FOR 300+ CONCURRENT STUDENTS)
 * ==========================================================================
 * 
 * PANDUAN PEMASANGAN (HANYA 3 MENIT):
 * 1. Buat Google Spreadsheet baru di Google Drive Anda.
 * 2. Beri nama file: "CBT TKA Matematika SMKN 2 Gorontalo - Hasil & Log"
 * 3. Klik menu: Extensions (Ekstensi) -> Apps Script
 * 4. Hapus seluruh kode bawaan yang ada di editor, lalu PASTE SELURUH KODE INI.
 * 5. Klik icon Save (Simpan).
 * 6. Klik tombol "Deploy" (Terapkan) di pojok kanan atas -> "New deployment" (Penerapan baru)
 * 7. Pilih tipe: "Web app" (Aplikasi Web)
 *    - Description: CBT Gorontalo Handler
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)  <--- PENTING! Agar siswa dapat mengirim jawaban
 * 8. Klik "Deploy", izinkan hak akses (Review Permissions -> Lanjutan -> Buka CBT... (tidak aman) -> Izinkan)
 * 9. Salin URL Aplikasi Web (Web App URL yang berakhiran /exec)
 * 10. Masukkan URL tersebut ke Pengaturan CBT di Dashboard Admin aplikasi.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: HASIL_UJIAN
  var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
  if (!sheetHasil) {
    sheetHasil = ss.insertSheet("HASIL_UJIAN");
    sheetHasil.appendRow([
      "Timestamp", "NISN", "NIPD", "Nama Siswa", "Rombel", "JK",
      "Nilai Akhir (0-100)", "Poin Mentah", "Total Soal Terjawab",
      "Jumlah Pelanggaran", "Durasi Pengerjaan (Detik)", "Alasan Selesai",
      "Daftar Pelanggaran", "Resolusi Layar", "User Agent / Perangkat", "Status Sinkron"
    ]);
    sheetHasil.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
    sheetHasil.setFrozenRows(1);
  }

  // Sheet 2: LOG_PELANGGARAN (Real-time Audit Log)
  var sheetLog = ss.getSheetByName("LOG_PELANGGARAN");
  if (!sheetLog) {
    sheetLog = ss.insertSheet("LOG_PELANGGARAN");
    sheetLog.appendRow([
      "Timestamp Kejadian", "NISN", "Nama Siswa", "Rombel", "Jenis Pelanggaran", "Detail Kejadian", "User Agent"
    ]);
    sheetLog.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#991b1b").setFontColor("#ffffff");
    sheetLog.setFrozenRows(1);
  }

  // Sheet 3: MONITORING_REALTIME (Heartbeat)
  var sheetMon = ss.getSheetByName("MONITORING_REALTIME");
  if (!sheetMon) {
    sheetMon = ss.insertSheet("MONITORING_REALTIME");
    sheetMon.appendRow([
      "NISN", "NIPD", "Nama Siswa", "Rombel", "Progress (%)", "Soal Terjawab", "Jml Pelanggaran", "Pelanggaran Terakhir", "Update Terakhir", "Status"
    ]);
    sheetMon.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
    sheetMon.setFrozenRows(1);
  }
}

// Menangani permintaan POST (Pengiriman lembar jawaban siswa & Heartbeat)
function doPost(e) {
  // Gunakan ScriptLock agar 300 siswa yang mengumpulkan bersamaan TIDAK saling tabrak!
  var lock = LockService.getScriptLock();
  var success = false;
  
  try {
    // Tunggu giliran maksimal 30 detik untuk antrean
    lock.waitLock(30000);
    
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    setupSheets();

    // 1. Aksi SUBMISSION (Selesai Ujian)
    if (data.action === "SUBMIT_EXAM" || (!data.action && data.nisn)) {
      var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
      var sheetLog = ss.getSheetByName("LOG_PELANGGARAN");

      var violationsSummary = "";
      if (data.violations && data.violations.length > 0) {
        violationsSummary = data.violations.map(function(v) {
          return "[" + (v.at ? v.at.substring(11, 19) : "") + "] " + v.reason;
        }).join(" | ");

        // Catat setiap pelanggaran ke sheet LOG_PELANGGARAN
        data.violations.forEach(function(v) {
          sheetLog.appendRow([
            v.at || new Date().toISOString(),
            data.nisn,
            data.nama,
            data.rombel,
            v.type || "Kecurangan",
            v.reason,
            data.userAgent || ""
          ]);
        });
      }

      var rowValues = [
        data.submittedAt || new Date().toISOString(),
        "'" + String(data.nisn),
        "'" + String(data.nipd),
        data.nama,
        data.rombel,
        data.jk || "-",
        data.score,
        data.rawEarned || data.score,
        data.answeredCount || 0,
        data.violationCount || 0,
        data.durationUsedSeconds || 0,
        data.reason || "Selesai",
        violationsSummary,
        data.screenResolution || "-",
        data.userAgent || "-",
        "OK"
      ];

      // PASTIKAN DATA TERSIMPAN DAN TIDAK TERTIMPAH:
      // Setiap pengumpulan selalu disimpan sebagai baris baru permanen di HASIL_UJIAN
      sheetHasil.appendRow(rowValues);

      // Update status terkini di monitoring real-time
      updateRealtimeRow(ss, {
        nisn: data.nisn,
        nipd: data.nipd,
        nama: data.nama,
        rombel: data.rombel,
        progressPercent: 100,
        answeredCount: data.answeredCount || 25,
        violationCount: data.violationCount || 0,
        lastViolation: violationsSummary.substring(0, 50),
        status: "submitted"
      });

      success = true;
      return createJsonResponse({
        status: "success",
        message: "Jawaban berhasil disimpan secara permanen ke Google Spreadsheet (tidak tertimpah)",
        nisn: data.nisn,
        nama: data.nama,
        score: data.score
      });
    }

    // 2. Aksi HEARTBEAT / REAL-TIME MONITORING
    if (data.action === "HEARTBEAT") {
      updateRealtimeRow(ss, data);
      return createJsonResponse({ status: "success", message: "Heartbeat logged" });
    }

    // 3. Aksi LOG SINGLE VIOLATION INSTANTLY
    if (data.action === "LOG_VIOLATION") {
      var sLog = ss.getSheetByName("LOG_PELANGGARAN");
      sLog.appendRow([
        data.at || new Date().toISOString(),
        data.nisn,
        data.nama,
        data.rombel,
        data.type || "Kecurangan",
        data.reason,
        data.userAgent || ""
      ]);
      return createJsonResponse({ status: "success", message: "Violation audit recorded" });
    }

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }

  return createJsonResponse({ status: "error", message: "Unknown action" });
}

function updateRealtimeRow(ss, data) {
  var sheet = ss.getSheetByName("MONITORING_REALTIME");
  if (!sheet) return;
  var values = sheet.getDataRange().getValues();
  var row = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.nisn)) {
      row = i + 1;
      break;
    }
  }

  var rowData = [
    "'" + String(data.nisn),
    "'" + String(data.nipd),
    data.nama,
    data.rombel,
    data.progressPercent || 0,
    data.answeredCount || 0,
    data.violationCount || 0,
    data.lastViolation || "-",
    new Date().toLocaleTimeString("id-ID"),
    data.status || "active"
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Menangani permintaan GET (Test koneksi & Sinkronisasi/Download Data Spreadsheet)
function doGet(e) {
  setupSheets();
  var params = (e && e.parameter) ? e.parameter : {};

  // Aksi Unduh Data untuk Sinkronisasi Dashboard Pengawas
  if (params.action === "DOWNLOAD_DATA" || params.action === "SYNC_FETCH" || params.action === "GET_ALL") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
    var sheetMon = ss.getSheetByName("MONITORING_REALTIME");

    var submissions = [];
    if (sheetHasil) {
      var hData = sheetHasil.getDataRange().getValues();
      for (var i = 1; i < hData.length; i++) {
        var row = hData[i];
        if (row[1]) {
          var cleanNisn = String(row[1]).replace(/^'/, "");
          var cleanNipd = String(row[2]).replace(/^'/, "");
          submissions.push({
            submittedAt: row[0] ? new Date(row[0]).toISOString() : new Date().toISOString(),
            nisn: cleanNisn,
            nipd: cleanNipd,
            nama: row[3] || "",
            rombel: row[4] || "",
            jk: row[5] || "-",
            score: Number(row[6]) || 0,
            rawEarned: Number(row[7]) || 0,
            answeredCount: Number(row[8]) || 25,
            violationCount: Number(row[9]) || 0,
            durationUsedSeconds: Number(row[10]) || 0,
            reason: row[11] || "Selesai",
            violationsSummary: row[12] || "",
            screenResolution: row[13] || "-",
            userAgent: row[14] || "-",
            syncStatus: "synced"
          });
        }
      }
    }

    var heartbeats = {};
    if (sheetMon) {
      var mData = sheetMon.getDataRange().getValues();
      for (var j = 1; j < mData.length; j++) {
        var mRow = mData[j];
        if (mRow[0]) {
          var mNisn = String(mRow[0]).replace(/^'/, "");
          heartbeats[mNisn] = {
            studentId: String(mRow[1]).replace(/^'/, ""),
            nisn: mNisn,
            nipd: String(mRow[1]).replace(/^'/, ""),
            nama: mRow[2],
            rombel: mRow[3],
            progressPercent: Number(mRow[4]) || 0,
            answeredCount: Number(mRow[5]) || 0,
            violationCount: Number(mRow[6]) || 0,
            lastViolation: mRow[7] || "",
            lastActive: new Date().toISOString(),
            status: mRow[9] || "active"
          };
        }
      }
    }

    return createJsonResponse({
      status: "success",
      totalSubmissions: submissions.length,
      submissions: submissions,
      heartbeats: heartbeats,
      timestamp: new Date().toISOString()
    });
  }

  return createJsonResponse({
    status: "online",
    school: "SMK NEGERI 2 GORONTALO",
    service: "CBT TKA Matematika Gateway",
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
