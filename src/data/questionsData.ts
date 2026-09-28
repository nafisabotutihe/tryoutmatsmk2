export type QuestionType = 'pg' | 'mcma' | 'bs';

export interface BaseQuestion {
  no: number;
  type: QuestionType;
  stim: string;
  text: string;
}

export interface PGQuestion extends BaseQuestion {
  type: 'pg';
  opt: string[];
  ans: number;
}

export interface MCMAQuestion extends BaseQuestion {
  type: 'mcma';
  st: string[];
  cor: number[];
}

export interface BSQuestion extends BaseQuestion {
  type: 'bs';
  st: string[];
  cor: boolean[];
}

export type Question = PGQuestion | MCMAQuestion | BSQuestion;

export const QUESTIONS_DATA: Question[] = [
  {
    no: 1,
    type: 'pg',
    stim: 'Pada kegiatan praktik Teknik Pemesinan, murid memeriksa persediaan baut untuk merakit komponen. Baut disimpan dalam 15 kotak, setiap kotak berisi 20 baut ukuran M8 dan 8 baut ukuran M10. Perhitungan awal: 15 × (20 + 8).',
    text: 'Guru meminta murid menunjukkan bentuk perhitungan yang setara menggunakan sifat distributif. Bentuk yang tepat adalah…',
    opt: [
      '15 × 20 + 8',
      '(15 × 20) + (15 × 8)',
      '15 + 20 × 15 + 8',
      '15 × 20 × 8',
      '(15 + 20) × (15 + 8)'
    ],
    ans: 1
  },
  {
    no: 2,
    type: 'mcma',
    stim: `<table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-slate-800/80 text-cyan-300">
          <th class="border border-slate-700 px-3 py-2">Planet</th>
          <th class="border border-slate-700 px-3 py-2">Jari-jari (km)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Bumi</td><td class="border border-slate-700 px-3 py-1.5 text-center">6,38 × 10³</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Jupiter</td><td class="border border-slate-700 px-3 py-1.5 text-center">7,15 × 10⁴</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Mars</td><td class="border border-slate-700 px-3 py-1.5 text-center">3,40 × 10³</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Merkurius</td><td class="border border-slate-700 px-3 py-1.5 text-center">2,44 × 10³</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Neptunus</td><td class="border border-slate-700 px-3 py-1.5 text-center">2,48 × 10⁴</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Saturnus</td><td class="border border-slate-700 px-3 py-1.5 text-center">6,03 × 10⁴</td></tr>
        <tr class="border-b border-slate-700/50"><td class="border border-slate-700 px-3 py-1.5 text-center">Uranus</td><td class="border border-slate-700 px-3 py-1.5 text-center">2,56 × 10⁴</td></tr>
        <tr><td class="border border-slate-700 px-3 py-1.5 text-center">Venus</td><td class="border border-slate-700 px-3 py-1.5 text-center">6,05 × 10³</td></tr>
      </tbody>
    </table>`,
    text: 'Tentukan semua pernyataan yang benar (jawaban benar dapat lebih dari satu):',
    st: [
      'Jari-jari planet Uranus lebih panjang daripada jari-jari planet Venus.',
      'Jari-jari planet Mars lebih panjang daripada jari-jari planet Neptunus.',
      'Selisih panjang jari-jari planet Merkurius dan Neptunus adalah 400 km.',
      'Selisih panjang jari-jari planet Jupiter dan Saturnus adalah 11.200 km.',
      'Selisih panjang jari-jari planet Bumi dan Venus adalah 3.300 km.'
    ],
    cor: [0, 3]
  },
  {
    no: 3,
    type: 'pg',
    stim: 'Diketahui P = (a·b²·c⁷) / (a⁻²·b⁶·c⁴), dengan nilai a = 2/3, b = 2, dan c = 3.',
    text: 'Nilai dari P adalah…',
    opt: ['4', '2', '1', '1/2', '1/4'],
    ans: 3
  },
  {
    no: 4,
    type: 'pg',
    stim: 'Dalam Gelar Karya dan Unit Produksi SMK, dijual dua paket makanan & minuman: Paket A (2 burger + 3 minuman = Rp75.000) dan Paket B (3 burger + 2 minuman = Rp80.000).',
    text: 'Seorang pembeli membeli m burger dan n minuman dengan total belanja Rp62.000. Nilai dari m + n adalah…',
    opt: ['2', '3', '4', '5', '6'],
    ans: 2
  },
  {
    no: 5,
    type: 'mcma',
    stim: `<div class="flex flex-col items-center">
      <svg viewBox="0 0 240 200" class="w-full max-w-[280px] h-auto my-2 text-slate-200">
        <line x1="30" y1="170" x2="30" y2="10" stroke="currentColor" stroke-width="1.5"/>
        <line x1="30" y1="170" x2="220" y2="170" stroke="currentColor" stroke-width="1.5"/>
        <text x="222" y="175" font-size="10" fill="currentColor">X</text>
        <text x="20" y="12" font-size="10" fill="currentColor">Y</text>
        <line x1="30" y1="82" x2="180" y2="170" stroke="#3b82f6" stroke-width="2"/>
        <line x1="30" y1="38" x2="80" y2="170" stroke="#22c55e" stroke-width="2"/>
        <circle cx="30" cy="82" r="3" fill="#3b82f6"/>
        <circle cx="180" cy="170" r="3" fill="#3b82f6"/>
        <circle cx="30" cy="38" r="3" fill="#22c55e"/>
        <circle cx="80" cy="170" r="3" fill="#22c55e"/>
        <text x="18" y="86" font-size="10" fill="currentColor">4</text>
        <text x="18" y="42" font-size="10" fill="currentColor">6</text>
        <text x="76" y="184" font-size="10" fill="currentColor">2</text>
        <text x="176" y="184" font-size="10" fill="currentColor">6</text>
        <text x="50" y="55" font-size="12" font-weight="bold" fill="currentColor">I</text>
        <text x="145" y="75" font-size="12" font-weight="bold" fill="currentColor">IV</text>
        <text x="40" y="150" font-size="12" font-weight="bold" fill="currentColor">V</text>
        <text x="65" y="115" font-size="12" font-weight="bold" fill="currentColor">II</text>
        <text x="135" y="150" font-size="12" font-weight="bold" fill="currentColor">III</text>
      </svg>
      <div class="text-xs text-slate-400 mt-1">Garis biru: 2x+3y=12 (memotong sumbu-Y di 4, sumbu-X di 6). Garis hijau: 3x+y=6 (memotong sumbu-Y di 6, sumbu-X di 2). Sistem: 2x+3y ≤ 12 ; 3x+y ≥ 6 ; x ≥ 0 ; y ≥ 0.</div>
    </div>`,
    text: 'Manakah daerah (I–V) yang TIDAK menyatakan daerah hasil penyelesaian? (jawaban benar lebih dari satu)',
    st: ['I', 'II', 'III', 'IV', 'V'],
    cor: [0, 1, 3, 4]
  },
  {
    no: 6,
    type: 'pg',
    stim: 'Unit Produksi SMK memasarkan Produk A (modal Rp30.000/unit, untung Rp18.000) dan Produk B (modal Rp25.000/unit, untung Rp16.000). Kapasitas maksimal tempat penjualan adalah 100 produk/bulan, dan modal tersedia Rp2.800.000.',
    text: 'Keuntungan maksimum yang dapat diperoleh adalah…',
    opt: [
      'Rp1.620.000,00',
      'Rp1.700.000,00',
      'Rp1.720.000,00',
      'Rp1.780.000,00',
      'Rp1.800.000,00'
    ],
    ans: 2
  },
  {
    no: 7,
    type: 'pg',
    stim: 'Diketahui fungsi f: x → 2x − 3, dengan himpunan asal {x | −2 ≤ x ≤ 4, x bilangan bulat genap}.',
    text: 'Domain, kodomain, dan range yang benar dari fungsi tersebut adalah…',
    opt: [
      'Df = {-2, 0, 2, 4}; Kf = {x | x ∈ ℤ}; Rf = {-7, -3, 1, 5}',
      'Df = {0, 2}; Kf = {-7, -3, 1, 5}; Rf = {-7, -3, 2, 4}',
      'Df = {x | x ∈ ℤ}; Kf = {x | x ∈ ℤ}; Rf = {-7, -3, 1, 5}',
      'Df = {-2, 0, 2, 4}; Kf = {x | x ∈ ℤ}; Rf = {-2, 0, 1, 5}',
      'Df = {0, 2}; Kf = {x | x ∈ ℤ}; Rf = {-7, -3, 1, 5}'
    ],
    ans: 0
  },
  {
    no: 8,
    type: 'bs',
    stim: 'Diketahui fungsi f(x) = (5x − 1) / (4x + 3), dengan x ≠ −3/4.',
    text: 'Tentukan Benar atau Salah untuk setiap pernyataan berikut:',
    st: [
      'Nilai f⁻¹(1) adalah 4',
      'Nilai f⁻¹(3) adalah 1 3/7',
      'Nilai f⁻¹(6) adalah −1'
    ],
    cor: [true, false, true]
  },
  {
    no: 9,
    type: 'pg',
    stim: 'Diketahui fungsi f(x) = 2x + 3 dan g(x) = x² − 1.',
    text: 'Nilai dari komposisi fungsi (f ∘ g)(2) adalah…',
    opt: ['7', '9', '11', '13', '15'],
    ans: 1
  },
  {
    no: 10,
    type: 'pg',
    stim: 'Unit produksi SMK membuat produk kerajinan tangan. Hari pertama menghasilkan 25 produk, bertambah secara tetap setiap hari berikutnya, dan pada hari ke-10 mencapai 70 produk.',
    text: 'Selisih (beda) jumlah produk yang dihasilkan setiap hari adalah…',
    opt: ['4 produk', '5 produk', '6 produk', '7 produk', '8 produk'],
    ans: 1
  },
  {
    no: 11,
    type: 'pg',
    stim: 'Kelompok murid membuat komponen menggunakan mesin produksi. Hari pertama menghasilkan 4 komponen, jumlah produksi setiap hari menjadi 2 kali lipat dari hari sebelumnya, berlangsung selama 6 hari.',
    text: 'Jumlah seluruh komponen yang dihasilkan selama 6 hari adalah…',
    opt: ['124', '126', '248', '252', '256'],
    ans: 3
  },
  {
    no: 12,
    type: 'bs',
    stim: `Rangka bengkel SMK berbentuk balok ABCD.EFGH. Batang AB dan CD berada pada sisi bawah dan sejajar; AB dan AE bertemu di titik A membentuk sudut 90°; permukaan ABCD dan EFGH tidak berpotongan, bentuk & ukuran sama; AB pada permukaan bawah, EF pada permukaan atas.
    <div class="flex justify-center my-2">
      <svg viewBox="0 0 220 200" class="w-48 h-auto text-slate-300">
        <polygon points="50,160 150,160 180,130 80,130" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <polygon points="50,80 150,80 180,50 80,50" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <line x1="50" y1="160" x2="50" y2="80" stroke="currentColor" stroke-width="1.5"/>
        <line x1="150" y1="160" x2="150" y2="80" stroke="currentColor" stroke-width="1.5"/>
        <line x1="180" y1="130" x2="180" y2="50" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4"/>
        <line x1="80" y1="130" x2="80" y2="50" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4"/>
        <line x1="80" y1="130" x2="150" y2="130" stroke="currentColor" stroke-width="1" stroke-dasharray="3" opacity=".4"/>
        <text x="38" y="172" font-size="11" fill="currentColor">A</text>
        <text x="154" y="172" font-size="11" fill="currentColor">B</text>
        <text x="184" y="128" font-size="11" fill="currentColor">C</text>
        <text x="66" y="128" font-size="11" fill="currentColor">D</text>
        <text x="38" y="76" font-size="11" fill="currentColor">E</text>
        <text x="154" y="76" font-size="11" fill="currentColor">F</text>
        <text x="184" y="46" font-size="11" fill="currentColor">G</text>
        <text x="66" y="46" font-size="11" fill="currentColor">H</text>
      </svg>
    </div>`,
    text: 'Tentukan Benar (B) atau Salah (S) untuk pernyataan hubungan antar garis dan bidang berikut:',
    st: [
      'Batang AB dan CD merupakan dua garis sejajar',
      'Sudut BAE merupakan sudut siku-siku',
      'Bidang ABCD dan EFGH merupakan dua bidang yang sejajar',
      'Batang AB dan EF merupakan dua garis yang berpotongan',
      'Jika dua bidang tidak berpotongan, maka kedua bidang tersebut dapat merupakan bidang sejajar'
    ],
    cor: [true, true, true, false, true]
  },
  {
    no: 13,
    type: 'pg',
    stim: 'Murid membuat kotak penyimpanan berbentuk balok tanpa tutup dengan dimensi: panjang 40 cm, lebar 25 cm, tinggi 20 cm. Alas kotak menggunakan lembaran seukuran panjang dan lebar kotak.',
    text: 'Luas bahan yang diperlukan untuk membuat alas kotak tersebut adalah…',
    opt: ['500 cm²', '800 cm²', '1.000 cm²', '1.300 cm²', '1.600 cm²'],
    ans: 2
  },
  {
    no: 14,
    type: 'pg',
    stim: `Praktik DKV: murid membuat dua pola logo berbentuk persegi panjang. Pola pertama berukuran 12 cm × 8 cm, pola kedua berukuran 18 cm × 12 cm.
    <div class="flex justify-center my-2">
      <svg viewBox="0 0 230 100" class="w-56 h-auto text-slate-300">
        <rect x="15" y="15" width="60" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <text x="20" y="70" font-size="10" fill="currentColor">12 cm × 8 cm</text>
        <rect x="115" y="10" width="90" height="60" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <text x="118" y="85" font-size="10" fill="currentColor">18 cm × 12 cm</text>
      </svg>
    </div>`,
    text: 'Hubungan antara kedua pola logo tersebut adalah…',
    opt: [
      'Kongruen, karena kedua pola berbentuk persegi panjang',
      'Kongruen, karena memiliki bentuk yang sama',
      'Sebangun, karena perbandingan sisi-sisi yang bersesuaian sama',
      'Tidak sebangun, karena ukuran kedua pola berbeda',
      'Tidak berhubungan, karena dibuat dengan ukuran berbeda'
    ],
    ans: 2
  },
  {
    no: 15,
    type: 'mcma',
    stim: `Rangka penyangga segitiga siku-siku di bengkel SMK. Jarak A–B pada lantai datar adalah 9 m, tinggi penyangga B ke C adalah 12 m, dan dipasang batang diagonal dari A ke C.
    <div class="flex justify-center my-2">
      <svg viewBox="0 0 220 190" class="w-48 h-auto text-slate-300">
        <line x1="30" y1="150" x2="150" y2="150" stroke="currentColor" stroke-width="2"/>
        <line x1="150" y1="150" x2="150" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="30" y1="150" x2="150" y2="30" stroke="#3b82f6" stroke-width="2"/>
        <polyline points="138,150 138,138 150,138" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <text x="20" y="168" font-size="11" fill="currentColor">A</text>
        <text x="154" y="168" font-size="11" fill="currentColor">B</text>
        <text x="154" y="26" font-size="11" fill="currentColor">C</text>
        <text x="82" y="168" font-size="10" fill="currentColor">9 m</text>
        <text x="158" y="94" font-size="10" fill="currentColor">12 m</text>
        <text x="70" y="85" font-size="10" fill="#3b82f6">AC = ?</text>
      </svg>
    </div>`,
    text: 'Tentukan semua pernyataan yang benar (jawaban benar lebih dari satu):',
    st: [
      'Panjang batang penyangga AC adalah 15 meter.',
      'Segitiga ABC merupakan segitiga siku-siku dengan sisi siku-siku 9 m dan 12 m.',
      'Jika panjang AB diperbesar menjadi 12 m sementara BC tetap 12 m, maka panjang AC menjadi 24 m.',
      'Jika panjang batang penyangga AC yang tersedia hanya 14 m, batang tersebut tidak dapat mencapai titik C dari titik A.',
      'Panjang batang penyangga AC lebih pendek daripada jumlah panjang AB dan BC.'
    ],
    cor: [0, 1, 3, 4]
  },
  {
    no: 16,
    type: 'bs',
    stim: 'Diketahui titik P(2, −3) pada bidang koordinat Cartesius, ditransformasikan dengan beberapa jenis transformasi.',
    text: 'Tentukan Benar (B) atau Salah (S) untuk setiap hasil transformasi berikut:',
    st: [
      'Titik P ditranslasikan oleh T(3, 4), maka bayangannya adalah P′(5, 1).',
      'Titik P direfleksikan terhadap sumbu-X, maka bayangannya adalah P′(2, 3).',
      'Titik P direfleksikan terhadap sumbu-Y, maka bayangannya adalah P′(−2, 3).',
      'Titik P dirotasikan 90° berlawanan arah jarum jam dengan pusat O(0,0), maka bayangannya adalah P′(3, 2).',
      'Titik P didilatasi dengan pusat O(0,0) dan faktor skala 2, maka bayangannya adalah P′(4, −6).'
    ],
    cor: [true, true, false, true, true]
  },
  {
    no: 17,
    type: 'pg',
    stim: `Titik P(−4, 1) pada bidang koordinat ditranslasikan oleh T(3, −5), kemudian hasilnya direfleksikan terhadap sumbu-X.
    <div class="flex justify-center my-2">
      <svg viewBox="0 0 220 220" class="w-48 h-auto text-slate-300">
        <line x1="10" y1="110" x2="210" y2="110" stroke="currentColor" stroke-width="1"/>
        <line x1="110" y1="10" x2="110" y2="210" stroke="currentColor" stroke-width="1"/>
        <text x="200" y="122" font-size="10" fill="currentColor">X</text>
        <text x="118" y="18" font-size="10" fill="currentColor">Y</text>
        <line x1="30" y1="105" x2="30" y2="115" stroke="currentColor" stroke-width=".5"/><text x="26" y="128" font-size="8" fill="currentColor">-4</text>
        <line x1="50" y1="105" x2="50" y2="115" stroke="currentColor" stroke-width=".5"/><text x="46" y="128" font-size="8" fill="currentColor">-3</text>
        <line x1="70" y1="105" x2="70" y2="115" stroke="currentColor" stroke-width=".5"/><text x="66" y="128" font-size="8" fill="currentColor">-2</text>
        <line x1="90" y1="105" x2="90" y2="115" stroke="currentColor" stroke-width=".5"/><text x="86" y="128" font-size="8" fill="currentColor">-1</text>
        <line x1="130" y1="105" x2="130" y2="115" stroke="currentColor" stroke-width=".5"/><text x="126" y="128" font-size="8" fill="currentColor">1</text>
        <line x1="150" y1="105" x2="150" y2="115" stroke="currentColor" stroke-width=".5"/><text x="146" y="128" font-size="8" fill="currentColor">2</text>
        <line x1="170" y1="105" x2="170" y2="115" stroke="currentColor" stroke-width=".5"/><text x="166" y="128" font-size="8" fill="currentColor">3</text>
        <line x1="190" y1="105" x2="190" y2="115" stroke="currentColor" stroke-width=".5"/><text x="186" y="128" font-size="8" fill="currentColor">4</text>
        <circle cx="30" cy="90" r="3" fill="#3b82f6"/>
        <text x="15" y="82" font-size="10" fill="#3b82f6">P(−4,1)</text>
      </svg>
    </div>`,
    text: 'Koordinat bayangan akhir dari titik P adalah…',
    opt: ['(-1, -4)', '(-1, 4)', '(7, 4)', '(7, -4)', '(-7, 4)'],
    ans: 1
  },
  {
    no: 18,
    type: 'pg',
    stim: 'Praktik DKV: murid membuat papan promosi berbentuk persegi panjang dengan panjang 40 cm dan lebar 25 cm. Papan tersebut akan dipasang bingkai di sekeliling sisinya.',
    text: 'Panjang bingkai yang diperlukan untuk mengelilingi papan promosi tersebut adalah…',
    opt: ['100 cm', '120 cm', '130 cm', '140 cm', '150 cm'],
    ans: 2
  },
  {
    no: 19,
    type: 'pg',
    stim: 'Sebuah kotak penyimpanan berbentuk balok memiliki panjang 15 cm, lebar 8 cm, dan tinggi 10 cm. Seluruh permukaan luar kotak akan dicat rapi.',
    text: 'Luas permukaan kotak yang harus dicat adalah…',
    opt: ['460 cm²', '600 cm²', '700 cm²', '760 cm²', '800 cm²'],
    ans: 2
  },
  {
    no: 20,
    type: 'pg',
    stim: 'Praktik DKV: mendesain logo pada bidang koordinat dengan dua titik acuan utama yaitu titik A(2, 3) dan titik B(8, 3).',
    text: 'Jarak antara titik A dan titik B adalah…',
    opt: ['4 satuan', '5 satuan', '6 satuan', '7 satuan', '10 satuan'],
    ans: 2
  },
  {
    no: 21,
    type: 'mcma',
    stim: 'Praktik TJKT: kabel jaringan dipasang dari titik A di permukaan tanah menuju titik B pada tiang pemancar, membentuk segitiga siku-siku dengan tanah. Jarak horizontal A ke kaki tiang adalah 12 m, tinggi titik B dari tanah adalah 5 m, dan panjang kabel AB adalah 13 m. Sudut kemiringan kabel AB terhadap tanah adalah θ.',
    text: 'Pilih semua pernyataan perbandingan trigonometri yang benar (jawaban benar lebih dari satu):',
    st: [
      'sin θ = 5/13',
      'cos θ = 12/13',
      'tan θ = 5/12',
      'cot θ = 12/5',
      'sec θ = 13/5'
    ],
    cor: [0, 1, 2, 3]
  },
  {
    no: 22,
    type: 'pg',
    stim: 'Diketahui θ adalah sudut lancip pada kuadran I dan cos θ = 3/5.',
    text: 'Nilai dari sin θ + tan θ adalah…',
    opt: ['24/20', '4/3', '7/5', '29/15', '32/15'],
    ans: 4
  },
  {
    no: 23,
    type: 'bs',
    stim: `Praktikum Kimia Analisis: jumlah sampel yang dianalisis oleh 5 kelompok kerja dalam satu minggu.
    <div class="flex justify-center my-2">
      <svg viewBox="0 0 230 170" class="w-60 h-auto text-slate-200">
        <line x1="25" y1="140" x2="220" y2="140" stroke="currentColor"/>
        <line x1="25" y1="140" x2="25" y2="10" stroke="currentColor"/>
        <rect x="40" y="80" width="25" height="60" fill="#3b82f6" rx="2"/>
        <text x="46" y="75" font-size="9" fill="currentColor">12</text>
        <text x="49" y="155" font-size="10" fill="currentColor">A</text>
        <rect x="75" y="50" width="25" height="90" fill="#3b82f6" rx="2"/>
        <text x="81" y="45" font-size="9" fill="currentColor">18</text>
        <text x="84" y="155" font-size="10" fill="currentColor">B</text>
        <rect x="110" y="65" width="25" height="75" fill="#3b82f6" rx="2"/>
        <text x="116" y="60" font-size="9" fill="currentColor">15</text>
        <text x="119" y="155" font-size="10" fill="currentColor">C</text>
        <rect x="145" y="40" width="25" height="100" fill="#3b82f6" rx="2"/>
        <text x="151" y="35" font-size="9" fill="currentColor">20</text>
        <text x="154" y="155" font-size="10" fill="currentColor">D</text>
        <rect x="180" y="90" width="25" height="50" fill="#3b82f6" rx="2"/>
        <text x="186" y="85" font-size="9" fill="currentColor">10</text>
        <text x="189" y="155" font-size="10" fill="currentColor">E</text>
        <text x="2" y="14" font-size="9" fill="currentColor">Sampel</text>
      </svg>
    </div>
    <table class="w-full border-collapse text-xs mt-2">
      <thead>
        <tr class="bg-slate-800 text-cyan-300">
          <th class="border border-slate-700 p-1">Kelompok</th>
          <th class="border border-slate-700 p-1">A</th>
          <th class="border border-slate-700 p-1">B</th>
          <th class="border border-slate-700 p-1">C</th>
          <th class="border border-slate-700 p-1">D</th>
          <th class="border border-slate-700 p-1">E</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-700 p-1 text-center font-semibold">Sampel</td>
          <td class="border border-slate-700 p-1 text-center">12</td>
          <td class="border border-slate-700 p-1 text-center">18</td>
          <td class="border border-slate-700 p-1 text-center">15</td>
          <td class="border border-slate-700 p-1 text-center">20</td>
          <td class="border border-slate-700 p-1 text-center">10</td>
        </tr>
      </tbody>
    </table>`,
    text: 'Tentukan Benar (B) atau Salah (S) untuk pernyataan analisis data berikut:',
    st: [
      'Kelompok D menganalisis sampel paling banyak.',
      'Kelompok E menganalisis 10 sampel.',
      'Kelompok A menganalisis lebih banyak sampel daripada kelompok C.',
      'Selisih jumlah sampel kelompok D dan kelompok B adalah 2 sampel.',
      'Jumlah seluruh sampel yang dianalisis kelima kelompok adalah 75 sampel.'
    ],
    cor: [true, true, false, true, true]
  },
  {
    no: 24,
    type: 'pg',
    stim: 'Tabel distribusi frekuensi nilai ulangan Matematika suatu kelas: interval 41–50 frekuensi 3, 51–60 frekuensi 3, 61–70 frekuensi (x), 71–80 frekuensi 1, dan 81–90 frekuensi 5. Diketahui modus data tersebut adalah 65.',
    text: 'Nilai frekuensi (x) pada kelas 61–70 yang tepat adalah…',
    opt: ['10', '11', '12', '13', '14'],
    ans: 2
  },
  {
    no: 25,
    type: 'pg',
    stim: 'Pada pembukaan pertandingan futsal antarkelas: Tim A terdiri dari 6 murid (saling berjabat tangan sesama anggota Tim A), dan Tim B terdiri dari 5 murid (saling berjabat tangan sesama anggota Tim B). Hanya jabat tangan antaranggota dalam masing-masing tim yang dihitung.',
    text: 'Banyak seluruh jabat tangan yang dilakukan oleh kedua tim tersebut adalah…',
    opt: ['20', '25', '30', '35', '40'],
    ans: 1
  }
];

export const EXAM_DURATION_SECONDS = 90 * 60; // 90 minutes
