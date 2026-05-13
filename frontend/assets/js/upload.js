/* =========================================================
   AMDOX — Upload Page JS
   ========================================================= */

const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('fileInput');
const fileSel    = document.getElementById('fileSelected');
const uploadBtn  = document.getElementById('uploadBtn');
const uploadBtnTxt = document.getElementById('uploadBtnText');
const uploadSpinner = document.getElementById('uploadSpinner');
const uploadResult  = document.getElementById('uploadResult');
const uploadProg    = document.getElementById('uploadProgress');
const progBar       = document.getElementById('progressBar');
const progPct       = document.getElementById('progressPct');

let selectedFile = null;

// Drag & drop
dropzone?.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone?.addEventListener('dragleave', ()  => dropzone.classList.remove('drag-over'));
dropzone?.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput?.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls','csv'].includes(ext)) {
    toast.error('Only .xlsx, .xls, or .csv files are allowed');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error('File size must be under 10MB');
    return;
  }
  selectedFile = file;
  document.getElementById('selectedFileName').textContent = file.name;
  document.getElementById('selectedFileSize').textContent = fmtSize(file.size);
  fileSel?.classList.remove('hidden');
  if (uploadBtn) uploadBtn.disabled = false;
  if (uploadResult) uploadResult.innerHTML = '';
  if (uploadProg) uploadProg.style.display = 'none';
  toast.info('File ready: ' + file.name);
}

function clearFile() {
  selectedFile = null;
  if (fileInput) fileInput.value = '';
  fileSel?.classList.add('hidden');
  if (uploadBtn) uploadBtn.disabled = true;
  if (uploadResult) uploadResult.innerHTML = '';
  if (uploadProg) uploadProg.style.display = 'none';
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(2) + ' MB';
}

async function uploadFile() {
  if (!selectedFile) { toast.warning('Please select a file first'); return; }

  if (uploadProg) uploadProg.style.display = 'block';
  if (uploadBtnTxt) uploadBtnTxt.textContent = 'Processing...';
  uploadSpinner?.classList.remove('hidden');
  if (uploadBtn) uploadBtn.disabled = true;
  if (uploadResult) uploadResult.innerHTML = '';

  // Fake progress animation
  let pct = 0;
  const fakeTimer = setInterval(() => {
    pct = Math.min(pct + Math.random() * 12, 85);
    if (progBar) progBar.style.width = pct + '%';
    if (progPct) progPct.textContent = Math.round(pct) + '%';
  }, 200);

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const { ok, data } = await api.upload('/admin/upload', formData);

    clearInterval(fakeTimer);
    if (progBar) progBar.style.width = '100%';
    if (progPct) progPct.textContent = '100%';

    if (ok && data.success) {
      renderSuccess(data);
      toast.success(`✅ Imported ${data.successCount} certificates!`);
    } else {
      renderFail(data.message || 'Upload failed');
      toast.error(data.message || 'Upload failed');
    }
  } catch (err) {
    clearInterval(fakeTimer);
    console.error('Upload error:', err);
    renderFail('Network error — make sure the backend is running on port 4000.');
    toast.error('Network error during upload');
  } finally {
    if (uploadBtnTxt) uploadBtnTxt.textContent = '📤 Upload & Import';
    uploadSpinner?.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = false;
    setTimeout(() => {
      if (uploadProg) uploadProg.style.display = 'none';
      if (progBar) progBar.style.width = '0%';
    }, 2000);
  }
}

function renderSuccess(data) {
  if (!uploadResult) return;
  uploadResult.innerHTML = `
    <div class="up-result ok">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <span style="font-size:2rem">✅</span>
        <div>
          <div style="font-weight:700;font-size:1.05rem">Upload Successful!</div>
          <div class="text-sm text-muted">${data.message}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
        <div style="text-align:center;padding:12px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:#10b981">${data.successCount}</div>
          <div class="text-xs text-muted">Inserted</div>
        </div>
        <div style="text-align:center;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:#ef4444">${data.errorCount}</div>
          <div class="text-xs text-muted">Failed</div>
        </div>
        <div style="text-align:center;padding:12px;background:rgba(212,160,23,.08);border:1px solid rgba(212,160,23,.2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:var(--g400)">${data.total}</div>
          <div class="text-xs text-muted">Total Rows</div>
        </div>
      </div>
      ${data.errors?.length ? `
        <div>
          <div class="text-sm" style="color:#f87171;margin-bottom:6px;font-weight:600">⚠ ${data.errors.length} row error(s):</div>
          <div class="err-list">${data.errors.map(e => `<div class="err-item">• ${e}</div>`).join('')}</div>
        </div>` : ''}
      <div style="display:flex;gap:10px;margin-top:14px">
        <a href="admin-students.html" class="btn btn-primary btn-sm">View Certificates →</a>
        <button class="btn btn-ghost btn-sm" onclick="clearFile()">Upload Another</button>
      </div>
    </div>`;
}

function renderFail(msg) {
  if (!uploadResult) return;
  uploadResult.innerHTML = `
    <div class="up-result fail">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:2rem">❌</span>
        <div>
          <div style="font-weight:700;font-size:1.05rem;color:#f87171">Upload Failed</div>
          <div class="text-sm text-muted">${msg}</div>
        </div>
      </div>
    </div>`;
}

function downloadTemplate() {
  const csv = [
    'certificate_id,student_name,email,domain,start_date,end_date,duration,grade',
    'AMDOX-2024-0001,Rahul Sharma,rahul@example.com,Web Development,2024-01-15,2024-04-15,3 Months,Excellent',
    'AMDOX-2024-0002,Priya Singh,priya@example.com,Data Science,2024-02-01,2024-05-01,3 Months,Outstanding',
    'AMDOX-2024-0003,Arjun Mehta,arjun@example.com,Machine Learning,2024-03-01,2024-06-01,3 Months,Excellent',
  ].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'amdox_certificate_template.csv';
  a.click(); URL.revokeObjectURL(url);
  toast.success('Template downloaded!');
}