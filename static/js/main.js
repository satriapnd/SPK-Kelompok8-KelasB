document.addEventListener('DOMContentLoaded', () => {
    // Tabs switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Upload logic
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('excel-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const processUploadBtn = document.getElementById('process-upload-btn');
    let selectedFile = null;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        if (!file.name.endsWith('.xlsx')) {
            alert('Harap pilih file excel (.xlsx)');
            return;
        }
        selectedFile = file;
        fileNameDisplay.innerHTML = `<i class="fa-solid fa-file-excel" style="color:#10b981;"></i> ${file.name}`;
        processUploadBtn.disabled = false;
    }

    processUploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);

        showLoader();
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            renderResults(data);
        } catch (err) {
            alert(err.message);
            hideLoader();
        }
    });

    // Manual Input logic
    const altBtns = document.querySelectorAll('.alt-btn');
    const formSections = document.querySelectorAll('.alt-form-section');
    
    altBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            altBtns.forEach(b => b.classList.remove('active'));
            formSections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`form-${btn.dataset.alt}`).classList.add('active');
        });
    });

    let respondentsData = [];
    const addRespondentBtn = document.getElementById('add-respondent-btn');
    const respCountVal = document.getElementById('resp-count-val');
    const manualForm = document.getElementById('manual-form');
    const resetManualBtn = document.getElementById('reset-manual-btn');
    const processManualBtn = document.getElementById('process-manual-btn');

    addRespondentBtn.addEventListener('click', () => {
        const formData = new FormData(manualForm);
        let resp = {};
        
        // Convert to structure
        window.APP_CONFIG.alternatif.forEach(alt => {
            resp[alt] = [];
            Object.keys(window.APP_CONFIG.kriteria).forEach(k_id => {
                const val = formData.get(`${alt}_${k_id}`);
                resp[alt].push(parseInt(val || 3));
            });
        });
        
        respondentsData.push(resp);
        respCountVal.textContent = respondentsData.length;
        
        // Reset form to default (3)
        manualForm.reset();
        
        alert(`Data responden ke-${respondentsData.length} berhasil disimpan secara lokal!`);
    });

    resetManualBtn.addEventListener('click', () => {
        if (respondentsData.length > 0 && confirm('Yakin ingin mereset semua data responden yang telah diinput?')) {
            respondentsData = [];
            respCountVal.textContent = '0';
            manualForm.reset();
        }
    });

    processManualBtn.addEventListener('click', async () => {
        if (respondentsData.length === 0) {
            alert('Silakan tambah minimal 1 data responden terlebih dahulu!');
            return;
        }

        showLoader();
        try {
            const res = await fetch('/api/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(respondentsData)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            renderResults(data);
        } catch (err) {
            alert(err.message);
            hideLoader();
        }
    });

    let currentResultData = null;
    let myChart = null;

    function showLoader() {
        document.getElementById('loader').classList.remove('hidden');
        document.getElementById('results-section').classList.add('hidden');
    }

    function hideLoader() {
        document.getElementById('loader').classList.add('hidden');
    }

    function renderResults(data) {
        currentResultData = data;
        hideLoader();
        document.getElementById('results-section').classList.remove('hidden');
        
        // Scroll smoothly to results
        setTimeout(() => {
            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Winner Text
        const winner = data.hasil[0];
        let displayName = winner.Alternatif;
        if (displayName.includes('JNT')) displayName = "JNT (J&T Express)";
        document.getElementById('winner-text').innerHTML = `<strong>${displayName}</strong> adalah pilihan jasa ekspedisi terbaik dengan nilai akhir sebesar <strong style="color:white; font-size:1.6rem;">${winner.Nilai_Akhir.toFixed(4)}</strong>`;

        // Tables
        renderTable('matriks-table', data.matriks);
        renderTable('norm-table', data.matriks_norm);
        
        const hasilTbody = document.querySelector('#hasil-table tbody');
        hasilTbody.innerHTML = '';
        data.hasil.forEach(row => {
            const isWinner = row.Rank === 1;
            hasilTbody.innerHTML += `
                <tr style="${isWinner ? 'background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981;' : ''}">
                    <td style="text-align: center;"><span class="badge" style="${isWinner ? 'background:#10b981; color:white; border:none;' : ''}">#${row.Rank}</span></td>
                    <td><strong style="color: ${isWinner ? '#10b981' : 'var(--text-main)'}; font-size:1.05rem;">${row.Alternatif}</strong></td>
                    <td style="text-align: right; font-weight: 600; padding-right: 30px; color: ${isWinner ? '#10b981' : 'var(--primary)'};">${row.Nilai_Akhir.toFixed(4)}</td>
                </tr>
            `;
        });

        // Charts
        renderChart('final');
    }

    function renderTable(tableId, data) {
        const table = document.getElementById(tableId);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (data.length === 0) return;
        
        const cols = Object.keys(data[0]);
        thead.innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
        
        tbody.innerHTML = '';
        data.forEach(row => {
            let tr = '<tr>';
            cols.forEach(c => {
                let val = row[c];
                if (typeof val === 'number') val = val.toFixed(4);
                if (c === 'Alternatif') val = `<strong style="color:var(--text-main);">${val}</strong>`;
                tr += `<td>${val}</td>`;
            });
            tr += '</tr>';
            tbody.innerHTML += tr;
        });
    }

    // Chart logic
    const chartTabBtns = document.querySelectorAll('.chart-tab-btn');
    chartTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chartTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderChart(btn.dataset.chart);
        });
    });

    function renderChart(type) {
        if (!currentResultData) return;
        
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (myChart) myChart.destroy();

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        if (type === 'final') {
            const labels = currentResultData.hasil.map(d => d.Alternatif);
            const values = currentResultData.hasil.map(d => d.Nilai_Akhir);
            
            // Generate colors: Winner is success color, others are primary
            const bgColors = currentResultData.hasil.map(d => 
                d.Rank === 1 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(59, 130, 246, 0.6)'
            );
            const borderColors = currentResultData.hasil.map(d => 
                d.Rank === 1 ? '#10b981' : '#3b82f6'
            );
            
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nilai Akhir SAW',
                        data: values,
                        backgroundColor: bgColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ' Nilai Akhir: ' + context.parsed.y.toFixed(4);
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } 
                        },
                        x: { 
                            grid: { display: false, drawBorder: false },
                            ticks: { font: { weight: '600' } }
                        }
                    }
                }
            });
        } else {
            // Grouped Bar for Criteria Comparison
            const labels = Object.keys(window.APP_CONFIG.kriteria);
            const datasets = [];
            
            const colors = [
                { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' }, // Blue
                { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' }, // Green
                { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' }, // Amber
                { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' }, // Red
                { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' }  // Purple
            ];

            currentResultData.matriks.forEach((row, i) => {
                const data = labels.map(k => row[k]);
                const colorSet = colors[i % colors.length];
                datasets.push({
                    label: row.Alternatif,
                    data: data,
                    backgroundColor: colorSet.bg,
                    borderColor: colorSet.border,
                    borderWidth: 1,
                    borderRadius: 4
                });
            });

            myChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const k_id = context[0].label;
                                    return `${k_id}: ${window.APP_CONFIG.kriteria[k_id]}`;
                                },
                                label: function(context) {
                                    return ` ${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // Download Excel
    document.getElementById('download-excel-btn').addEventListener('click', async () => {
        if (!currentResultData) return;
        
        try {
            const btn = document.getElementById('download-excel-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyiapkan File...';
            btn.disabled = true;

            const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentResultData)
            });
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Laporan_Hasil_SAW.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            alert('Gagal mengunduh laporan!');
        }
    });
});
