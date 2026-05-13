/* =========================================================
   AMDOX — Manage Certificates JS
   ========================================================= */

let currentPage = 1;
let totalPages  = 1;
let pendingDeleteId = null;
const LIMIT = 15;

const searchInput  = document.getElementById('searchInput');
const domainFilter = document.getElementById('domainFilter');
const statusFilter = document.getElementById('statusFilter');

// Listeners
searchInput?.addEventListener('input',  debounce(() => { currentPage = 1; loadCerts(); }, 400));
domainFilter?.addEventListener('change', () => { currentPage = 1; loadCerts(); });
statusFilter?.addEventListener('change', () => { currentPage = 1; loadCerts(); });

function resetFilters() {
  if (searchInput)  searchInput.value  = '';
  if (domainFilter) domainFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  currentPage = 1;
  loadCerts();
}

// ── Load certificates ───────────────────────────────────────
async function loadCerts() {
  const search = searchInput?.value.trim()  || '';
  const domain = domainFilter?.value        || '';
  const active = statusFilter?.value        || '';
  const params = new URLSearchParams({ page: currentPage, limit: LIMIT, search, domain, active });

  const tbody = document.getElementById('certTableBody');
  if (tbody) tbody.innerHTML = `
    <tr><td colspan="9" style="text-align:center;padding:48px">
      <div class="spinner spinner-lg" style="margin:0 auto;border-top-color:var(--g400)"></div>
    </td></tr>`;

  try {
    const { ok, data } = await api.get('/admin/certificates?' + params.toString());
    if (!ok) {
      toast.error('Failed to load: ' + (data.message || 'Server error'));
      if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--err)">
        Failed to load certificates. <button onclick="loadCerts()" class="btn btn-ghost btn-sm" style="margin-left:8px">Retry</button>
      </td></tr>`;
      return;
    }

    renderTable(data.data || []);
    renderPagination(data.pagination || { total:0, page:1, limit:LIMIT, pages:1 });

    const totalEl = document.getElementById('totalCount');
    if (totalEl) totalEl.textContent = (data.pagination?.total || 0).toLocaleString() + ' records found';

    // Populate domain filter once
    if (domainFilter && domainFilter.options.length <= 1 && data.data?.length > 0) {
      loadDomainOptions();
    }
  } catch (err) {
    console.error('Load certs error:', err);
    toast.error('Network error — is the backend running on port 4000?');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--err)">
      Network error. Make sure backend is running (<code>npm run dev</code> in backend folder).
      <br/><button onclick="loadCerts()" class="btn btn-outline btn-sm" style="margin-top:12px">↺ Retry</button>
    </td></tr>`;
  }
}

async function loadDomainOptions() {
  try {
    const { ok, data } = await api.get('/admin/stats');
    if (!ok || !data.domains) return;
    data.domains.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.domain; opt.textContent = d.domain;
      domainFilter.appendChild(opt);
    });
  } catch (_) {}
}

// ── Render table ────────────────────────────────────────────
function renderTable(certs) {
  const tbody = document.getElementById('certTableBody');
  if (!tbody) return;

  if (!certs.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--n300)">
      <div style="font-size:2.5rem;margin-bottom:12px">🔍</div>
      <div style="font-size:.95rem">No certificates found</div>
      <a href="admin-upload.html" class="btn btn-outline btn-sm" style="margin-top:14px;display:inline-flex">+ Upload Excel</a>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = certs.map(c => `
    <tr>
      <td>
        <span style="font-family:var(--ff-mono);font-size:.78rem;color:var(--g400);cursor:pointer"
              onclick="copyToClipboard('${c.certificate_id}')" title="Click to copy">
          ${c.certificate_id}
        </span>
      </td>
      <td style="font-weight:600;color:var(--white)">${c.student_name}</td>
      <td>${c.domain}</td>
      <td style="font-size:.8rem">${formatDate(c.start_date)}</td>
      <td style="font-size:.8rem">${formatDate(c.end_date)}</td>
      <td><span class="badge badge-gold">${c.grade || 'Excellent'}</span></td>
      <td><span class="badge ${c.is_active ? 'badge-success' : 'badge-error'}">${c.is_active ? '● Active' : '○ Inactive'}</span></td>
      <td style="text-align:center">${c.download_count || 0}</td>
      <td>
        <div style="display:flex;gap:5px;align-items:center">
          <button class="btn btn-ghost btn-sm" onclick="viewCert('${c.certificate_id}')" title="View">👁</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleStatus('${c.certificate_id}',${c.is_active ? 1:0})" title="${c.is_active ? 'Deactivate':'Activate'}">${c.is_active ? '⛔':'✅'}</button>
          <button class="btn btn-danger btn-sm" onclick="promptDelete('${c.certificate_id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Pagination ──────────────────────────────────────────────
function renderPagination(pg) {
  totalPages = pg.pages || 1;
  const { page, total, limit } = pg;
  const from = Math.min(((page-1)*limit)+1, total);
  const to   = Math.min(page*limit, total);

  const infoEl = document.getElementById('paginationInfo');
  if (infoEl) infoEl.textContent = total > 0 ? `Showing ${from}–${to} of ${total}` : 'No records';

  const btnsEl = document.getElementById('paginationBtns');
  if (!btnsEl) return;

  const range = getRange(page, totalPages);
  btnsEl.innerHTML = `
    <button class="pg-btn" onclick="goPage(${page-1})" ${page<=1?'disabled':''}>‹</button>
    ${range.map(p => p === '...'
      ? `<button class="pg-btn" disabled>…</button>`
      : `<button class="pg-btn ${p===page?'active':''}" onclick="goPage(${p})">${p}</button>`
    ).join('')}
    <button class="pg-btn" onclick="goPage(${page+1})" ${page>=totalPages?'disabled':''}>›</button>`;
}

function getRange(cur, total) {
  if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
  if (cur <= 4)   return [1,2,3,4,5,'...',total];
  if (cur >= total-3) return [1,'...',total-4,total-3,total-2,total-1,total];
  return [1,'...',cur-1,cur,cur+1,'...',total];
}

function goPage(p) {
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  loadCerts();
  window.scrollTo(0,0);
}

// ── Actions ─────────────────────────────────────────────────
function viewCert(certId) {
  api.get('/certificates/verify?id=' + encodeURIComponent(certId)).then(({ ok, data }) => {
    if (ok && data.success) {
      sessionStorage.setItem('cert_data', JSON.stringify(data.certificate));
      window.open('certificate.html', '_blank');
    } else {
      toast.error('Could not load certificate preview');
    }
  }).catch(() => toast.error('Network error'));
}

async function toggleStatus(certId, currentActive) {
  try {
    const newActive = currentActive === 1 ? false : true;
    const { ok, data } = await api.patch('/admin/certificates', {
      certificate_id: certId, is_active: newActive,
    });
    if (ok) { toast.success(data.message); loadCerts(); }
    else toast.error(data.message || 'Update failed');
  } catch { toast.error('Network error'); }
}

function promptDelete(certId) {
  pendingDeleteId = certId;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'none';
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  try {
    const { ok, data } = await api.delete('/admin/certificates', { certificate_id: pendingDeleteId });
    closeDeleteModal();
    if (ok) { toast.success('Certificate deleted'); loadCerts(); }
    else toast.error(data.message || 'Delete failed');
  } catch { toast.error('Network error'); }
});

document.getElementById('deleteModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

// ── Export CSV ───────────────────────────────────────────────
async function exportCSV() {
  toast.info('Preparing export...');
  try {
    const params = new URLSearchParams({
      page:1, limit:9999,
      search: searchInput?.value || '',
      domain: domainFilter?.value || '',
      active: statusFilter?.value || '',
    });
    const { ok, data } = await api.get('/admin/certificates?' + params);
    if (!ok) { toast.error('Export failed'); return; }

    const headers = ['Certificate ID','Student Name','Email','Domain','Start Date','End Date','Grade','Status','Downloads'];
    const csvRows = [
      headers.join(','),
      ...data.data.map(r => [
        r.certificate_id, r.student_name, r.email||'', r.domain,
        r.start_date, r.end_date, r.grade,
        r.is_active?'Active':'Inactive', r.download_count||0,
      ].map(v => `"${v}"`).join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `amdox_certificates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.data.length} records!`);
  } catch { toast.error('Export failed'); }
}

// Init
loadCerts();