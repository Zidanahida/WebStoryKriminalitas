# Kriminalitas Dalam Angka

Web story interaktif yang memvisualisasikan data kriminalitas Indonesia berdasarkan publikasi **Statistik Kriminal 2024** dari Badan Pusat Statistik (BPS). Dibangun dengan React + Vite.

---

## Tentang Proyek

Proyek ini menyajikan tiga pendekatan visualisasi data untuk menjawab pertanyaan: *apakah ada pola di balik angka kejahatan di Indonesia?*

Setiap chapter menggunakan teknik analisis yang berbeda untuk mengeksplorasi data dari sudut pandang yang unik — mulai dari profil kesejahteraan provinsi, kemiripan pola kejahatan antar-wilayah, hingga struktur hierarki kasus secara nasional.

---

## Struktur Chapter

### Visualisasi Multivariat
Delapan indikator kesejahteraan dan kriminalitas dari 34 provinsi diringkas ke dua dimensi menggunakan **Multidimensional Scaling (MDS) non-metrik (Kruskal)**. Provinsi dikelompokkan dengan **k-means (k=3)** dan ditampilkan dalam:
- **Biplot MDS** — posisi provinsi dan arah variabel, dengan fitur zoom, pan, dan brush selection
- **Radar Chart** — perbandingan profil 8 variabel antar-provinsi dalam skala persentil

Variabel yang digunakan: Crime Rate, Kemiskinan (P0), Tingkat Pengangguran Terbuka (TPT), Gini Ratio, IPM, Rata-rata Lama Sekolah (RLS), Pengeluaran per Kapita, dan Kepadatan Penduduk.

### Visualisasi Berjejaring
Jaringan kemiripan profil kejahatan antar-provinsi dibangun dari **korelasi Pearson** terhadap 36 jenis kejahatan. Setiap provinsi menunjuk maksimal 3 provinsi paling mirip (r ≥ 0.85), membentuk graf berarah. Komunitas dideteksi dengan algoritma **Louvain**. Visualisasi meliputi:
- **Force-Directed Graph** — layout Fruchterman-Reingold dengan drag interaktif
- **Adjacency Matrix Heatmap** — korelasi antar-provinsi dengan hover detail

### Visualisasi Hierarki
Data kasus kejahatan distrukturkan secara hierarkis: **Indonesia → Gugus Pulau → Provinsi**. Ukuran representasi proporsional terhadap total kasus, warna menunjukkan persentase kasus narkotika. Tersedia dua representasi dengan fitur drill-down:
- **Treemap** — squarified layout
- **Sunburst Chart** — radial layout dengan textPath label

---

## Sumber Data

| File | Digunakan di |
|------|-------------|
| `public/DataMultivariat.xlsx` | Chapter 1 — Visualisasi Multivariat |
| `public/DataBerjejaringHierarki.xlsx` | Chapter 2 & 3 — Berjejaring & Hierarki |

Sumber: **BPS, Statistik Kriminal 2024/2025**, Kepolisian Republik Indonesia.

---

## Teknologi

- **React 18** + **Vite**
- **SheetJS (xlsx)** — parsing file Excel
- Visualisasi dibangun dari scratch menggunakan **SVG** (tanpa library charting eksternal)
- Algoritma yang diimplementasikan secara manual:
  - MDS non-metrik (SMACOF + regresi isotonik)
  - K-means clustering (inisialisasi farthest-first)
  - Force-directed layout (Fruchterman-Reingold)
  - Louvain community detection
  - Squarified treemap

---

## Menjalankan Proyek

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

Pastikan file data Excel sudah ada di folder `public/` sebelum menjalankan aplikasi.

---

## Fitur Interaktif

- **Dynamic Island Navbar** — mengecil otomatis saat idle, menampilkan nama section aktif
- **Biplot MDS** — zoom, pan, brush selection, klik titik untuk highlight radar
- **Force Graph** — drag node, hover untuk highlight koneksi
- **Adjacency Matrix** — hover sel untuk nilai korelasi tepat
- **Treemap & Sunburst** — drill-down hierarki dengan breadcrumb navigasi
- **Radar Chart** — bandingkan hingga 4 provinsi sekaligus

---

Tugas Ujian Akhir Semester — Mata Kuliah Visualisasi Data  
Semester 6 · 2025/2026