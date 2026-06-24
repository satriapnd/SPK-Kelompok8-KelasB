import os
import pandas as pd
import json
import io
from flask import Flask, request, jsonify, render_template, send_file

app = Flask(__name__)

# Mengembalikan konfigurasi (hardcoded)
def load_config():
    return {
      "bobot": {
        "C1": 0.25,
        "C2": 0.20,
        "C3": 0.15,
        "C4": 0.10,
        "C5": 0.15,
        "C6": 0.15
      },
      "alternatif": [
        "JNE",
        "JNT",
        "Sicepat",
        "Anteraja",
        "POS Indonesia"
      ],
      "kriteria": {
        "C1": "Ongkos Kirim",
        "C2": "Kecepatan Pengiriman",
        "C3": "Keamanan Barang",
        "C4": "Jangkauan Wilayah",
        "C5": "Kemudahan Pelacakan",
        "C6": "Layanan Komplain"
      }
    }

def process_excel_data(df, alternatif_list):
    if len(df.columns) < 2:
        return None

    nama_col = df.columns[1]
    df = df[df[nama_col].apply(lambda x: isinstance(x, str) and str(x).strip().lower() not in ['rata-rata', 'rata rata', 'mean', 'average'])]

    hasil = {}
    start_col = 2 

    for alt in alternatif_list:
        if start_col + 6 > len(df.columns):
            return None
        df_sub = df.iloc[:, start_col:start_col+6].apply(pd.to_numeric, errors='coerce')
        rata_rata = df_sub.mean().tolist()
        hasil[alt] = rata_rata
        start_col += 6

    return hasil

def buat_matriks(data_dict):
    df = pd.DataFrame.from_dict(
        data_dict, 
        orient='index', 
        columns=['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
    )
    df.index.name = 'Alternatif'
    return df

def normalisasi(matriks):
    matriks_norm = matriks.copy()
    for col in matriks_norm.columns:
        max_val = matriks_norm[col].max()
        if max_val != 0:
            matriks_norm[col] = matriks_norm[col] / max_val
        else:
            matriks_norm[col] = 0.0
    return matriks_norm

def hitung_nilai_akhir(matriks_norm, bobot):
    hasil = []
    for index, row in matriks_norm.iterrows():
        nilai_akhir = 0
        for col in matriks_norm.columns:
            w = bobot.get(col, 0)
            nilai_akhir += row[col] * w
        hasil.append({
            'Alternatif': index,
            'Nilai_Akhir': nilai_akhir
        })
    df_hasil = pd.DataFrame(hasil)
    df_hasil = df_hasil.sort_values(by='Nilai_Akhir', ascending=False).reset_index(drop=True)
    df_hasil['Rank'] = df_hasil.index + 1
    df_hasil = df_hasil[['Rank', 'Alternatif', 'Nilai_Akhir']]
    return df_hasil

def generate_result_payload(data_dict, config):
    matriks = buat_matriks(data_dict)
    matriks_norm = normalisasi(matriks)
    hasil = hitung_nilai_akhir(matriks_norm, config['bobot'])
    
    # We will send data to frontend to plot
    matriks_json = matriks.reset_index().to_dict(orient='records')
    matriks_norm_json = matriks_norm.reset_index().to_dict(orient='records')
    hasil_json = hasil.to_dict(orient='records')
    
    return {
        'matriks': matriks_json,
        'matriks_norm': matriks_norm_json,
        'hasil': hasil_json
    }

@app.route('/')
def index():
    config = load_config()
    return render_template('index.html', config=config)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    config = load_config()
    try:
        df = pd.read_excel(file, sheet_name="Form Responses 1")
        data_dict = process_excel_data(df, config['alternatif'])
        if data_dict is None:
            return jsonify({'error': 'Gagal memproses data. Pastikan format kolom Excel Anda benar dan bukan file kosong.'}), 400
            
        payload = generate_result_payload(data_dict, config)
        return jsonify(payload)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/manual', methods=['POST'])
def manual_input():
    data = request.json
    if not data or not isinstance(data, list) or len(data) == 0:
        return jsonify({'error': 'No data provided'}), 400
        
    config = load_config()
    alternatif = config['alternatif']
    num_resp = len(data)
    
    avg_data_dict = {}
    for alt in alternatif:
        scores_list = [resp.get(alt, [0]*6) for resp in data]
        avg_scores = [sum(kriteria_scores)/num_resp for kriteria_scores in zip(*scores_list)]
        avg_data_dict[alt] = avg_scores
        
    payload = generate_result_payload(avg_data_dict, config)
    return jsonify(payload)

@app.route('/api/download', methods=['POST'])
def download_excel():
    data = request.json
    matriks = pd.DataFrame(data['matriks']).set_index('Alternatif')
    matriks_norm = pd.DataFrame(data['matriks_norm']).set_index('Alternatif')
    hasil = pd.DataFrame(data['hasil'])
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        matriks.to_excel(writer, sheet_name='Matriks Keputusan')
        matriks_norm.to_excel(writer, sheet_name='Matriks Ternormalisasi')
        hasil.to_excel(writer, sheet_name='Hasil & Ranking', index=False)
        
    output.seek(0)
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='Laporan_Hasil_SAW.xlsx'
    )

if __name__ == '__main__':
    app.run(debug=True, port=5001)
