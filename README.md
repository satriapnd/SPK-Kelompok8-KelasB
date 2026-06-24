# SPK Ekspedisi (Sistem Pendukung Keputusan Pemilihan Jasa Pengiriman)

Aplikasi web untuk membantu pengambilan keputusan dalam memilih jasa pengiriman yang terbaik menggunakan metode **SAW (Simple Additive Weighting)**.

## 📋 Daftar Isi
- [Deskripsi Program](#deskripsi-program)
- [Fitur Utama](#fitur-utama)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Proyek](#struktur-proyek)
- [Kriteria dan Bobot](#kriteria-dan-bobot)
- [Alternatif Pengiriman](#alternatif-pengiriman)

## 📖 Deskripsi Program

SPK Ekspedisi adalah aplikasi pendukung keputusan yang dirancang untuk membantu pengguna memilih jasa pengiriman terbaik berdasarkan berbagai kriteria. Aplikasi ini menggunakan metode SAW (Simple Additive Weighting), salah satu metode pengambilan keputusan multi-kriteria yang populer.

Sistem ini menganalisis data penilaian dari berbagai responden terhadap masing-masing jasa pengiriman dan memberikan ranking berdasarkan bobot kriteria yang telah ditentukan.

## ✨ Fitur Utama

1. **Unggah File Excel** - Impor data penilaian dari file Excel
2. **Input Manual** - Masukkan data penilaian secara langsung melalui antarmuka
3. **Normalisasi Data** - Sistem secara otomatis menormalisasi data untuk perbandingan yang adil
4. **Perhitungan SAW** - Menghitung nilai akhir menggunakan metode SAW
5. **Visualisasi Data** - Menampilkan matriks keputusan dan ranking dalam format visual
6. **Export Hasil** - Unduh laporan hasil analisis dalam format Excel

## 🖥️ Persyaratan Sistem

- Python 3.7 atau lebih tinggi
- Pip (Python Package Manager)

## 📦 Instalasi

### Langkah 1: Instalasi Dependencies

Buka terminal/command prompt di folder proyek dan jalankan:

```bash
pip install flask pandas openpyxl
```

Atau jika Anda memiliki file `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Langkah 2: Menjalankan Aplikasi

Dari folder proyek, jalankan perintah:

```bash
python app.py
```

Aplikasi akan berjalan di: **http://localhost:5001**

## 🚀 Cara Penggunaan

### Metode 1: Unggah File Excel

1. Buka aplikasi di browser: `http://localhost:5001`
2. Klik tombol **"Unggah File Excel"**
3. Pilih file Excel yang berisi data penilaian
4. File harus memiliki sheet bernama **"Form Responses 1"**
5. Klik **"Upload"** untuk memproses data
6. Sistem akan menampilkan matriks keputusan, matriks ternormalisasi, dan ranking

### Metode 2: Input Manual

1. Buka aplikasi di browser: `http://localhost:5001`
2. Klik tab **"Input Manual"**
3. Masukkan penilaian untuk setiap jasa pengiriman (1-5 atau sesuai skala yang digunakan)
4. Isi semua kriteria yang tersedia
5. Klik **"Kirim"** untuk memproses
6. Sistem akan menampilkan hasil analisis

### Mengunduh Hasil

Setelah mendapatkan hasil analisis:
1. Klik tombol **"Unduh Excel"**
2. Laporan akan diunduh dalam format Excel dengan sheet:
   - **Matriks Keputusan** - Data penilaian awal
   - **Matriks Ternormalisasi** - Data yang telah dinormalisasi
   - **Hasil & Ranking** - Ranking final jasa pengiriman

## 📁 Struktur Proyek

```
spk projek/
├── app.py                 # File utama aplikasi Flask
├── README.md             # Dokumentasi proyek (file ini)
├── templates/
│   └── index.html        # Template HTML antarmuka pengguna
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheet untuk tampilan
│   └── js/
│       └── main.js       # Script JavaScript untuk interaktivitas
└── data/                 # Folder untuk menyimpan data (opsional)
```

## 📊 Kriteria dan Bobot

Sistem menggunakan 6 kriteria dalam pengambilan keputusan:

| Kode | Kriteria | Bobot |
|------|----------|-------|
| C1 | Ongkos Kirim (Biaya) | 25% |
| C2 | Kecepatan Pengiriman | 20% |
| C3 | Keamanan Barang | 15% |
| C4 | Jangkauan Wilayah | 10% |
| C5 | Kemudahan Pelacakan | 15% |
| C6 | Layanan Komplain | 15% |

**Catatan:** Bobot dapat diubah dengan memodifikasi fungsi `load_config()` pada file `app.py`.

## 🚚 Alternatif Pengiriman

Sistem mengevaluasi 5 jasa pengiriman:

1. **JNE** - Jasa Pengiriman Negara
2. **JNT** - J&T Express
3. **Sicepat** - PT. Sicepat Ekspres Indonesia
4. **Anteraja** - Ante Logistics
5. **POS Indonesia** - Layanan Pengiriman Nasional

## 🔧 Cara Memodifikasi Konfigurasi

Untuk mengubah kriteria, bobot, atau alternatif, buka file `app.py` dan modifikasi fungsi `load_config()`:

```python
def load_config():
    return {
      "bobot": {
        "C1": 0.25,  # Ubah nilai bobot di sini
        "C2": 0.20,
        # ... kriteria lainnya
      },
      "alternatif": [
        "JNE",
        "JNT",
        # ... alternatif lainnya
      ],
      "kriteria": {
        "C1": "Ongkos Kirim",
        # ... kriteria lainnya
      }
    }
```

## 📝 Format File Excel

File Excel yang akan diunggah harus memiliki format berikut:

1. Sheet bernama **"Form Responses 1"**
2. Kolom pertama: Nomor urut atau ID
3. Kolom kedua: Nama penilai/responden
4. Kolom 3-8: Penilaian untuk C1, C2, C3, C4, C5, C6 (untuk JNE)
5. Kolom 9-14: Penilaian untuk C1-C6 (untuk JNT)
6. Dan seterusnya untuk setiap alternatif
7. Nilai penilaian berupa angka (numerik)

## 🎯 Metode SAW (Simple Additive Weighting)

Metode SAW bekerja dengan langkah-langkah:

1. **Normalisasi** - Membagi setiap nilai dengan nilai maksimum pada kolom tersebut
2. **Pembobotan** - Mengalikan setiap nilai ternormalisasi dengan bobot kriterianya
3. **Penjumlahan** - Menjumlahkan hasil pembobotan untuk mendapatkan nilai akhir
4. **Ranking** - Mengurutkan alternatif berdasarkan nilai akhir (semakin tinggi semakin baik)

## 🐛 Troubleshooting

```


