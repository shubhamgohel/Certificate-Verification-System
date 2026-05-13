/* =========================================================
   AMDOX — Dashboard JS
   ========================================================= */

async function loadDashboard() {
  try {
    const { ok, data } = await api.get('/admin/stats');
    if (!ok) { toast.error('Failed to load stats: ' + (data.message || 'Unknown error')); return; }

    // Stat cards — animate numbers
    animateNum('statTotal',     data.stats.totalCertificates);
    animateNum('statActive',    data.stats.activeCertificates);
    animateNum('statDownloads', data.stats.totalDownloads);
    animateNum('statInactive',  data.stats.inactiveCertificates);

    renderRecentCerts(data.recentCertificates);
    renderDomains(data.domains);
    renderUploads(data.recentUploads);

  } catch (err) {
    toast.error('Network error loading dashboard. Is the backend running?');
    console.error(err);
  }
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = parseInt(target) || 0;
  let cur = 0;
  const step = Math.max(1, Math.ceil(n / 50));
  const t = setInterval(() => {
    cur = Math.min(cur + step, n);
    el.textContent = cur.toLocaleString();
    if (cur >= n) clearInterval(t);
  }, 20);
}

function renderRecentCerts(certs) {
  const el = document.getElementById('recentCertsTable');
  if (!el) return;
  if (!certs || !certs.length) {
    el.innerHTML = '<p class="text-muted text-sm" style="padding:16px 0">No certificates yet. <a href="admin-upload.html" class="text-gold">Upload Excel →</a></p>';
    return;
  }
  el.innerHTML = `
    <table class="mini-tbl">
      <thead><tr><th>Cert ID</th><th>Student</th><th>Domain</th><th>Date</th></tr></thead>
      <tbody>
        ${certs.map(c => `
          <tr>
            <td><span style="font-family:var(--ff-mono);font-size:.78rem;color:var(--g400)">${c.certificate_id}</span></td>
            <td style="font-weight:600;color:var(--white)">${c.student_name}</td>
            <td>${c.domain}</td>
            <td style="font-size:.78rem">${formatDate(c.created_at)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderDomains(domains) {
  const el = document.getElementById('domainList');
  if (!el) return;
  if (!domains || !domains.length) { el.innerHTML = '<p class="text-muted text-sm">No data yet</p>'; return; }
  const max = Math.max(...domains.map(d => d.count), 1);
  el.innerHTML = domains.slice(0, 6).map(d => `
    <div class="dom-item">
      <div class="dom-row"><span>${d.domain}</span><span>${d.count}</span></div>
      <div class="dom-bg">
        <div class="dom-fill" data-w="${Math.round((d.count/max)*100)}" style="width:0%"></div>
      </div>
    </div>`).join('');
  setTimeout(() => {
    el.querySelectorAll('.dom-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 100);
}

function renderUploads(uploads) {
  const el = document.getElementById('uploadList');
  if (!el) return;
  if (!uploads || !uploads.length) {
    el.innerHTML = '<p class="text-muted text-sm" style="padding:8px 0">No uploads yet.</p>';
    return;
  }
  const badge = s => ({ completed:'badge-success', processing:'badge-warning', failed:'badge-error' }[s] || 'badge-info');
  el.innerHTML = uploads.map(u => `
    <div class="up-item">
      <div class="up-icon">📄</div>
      <div style="flex:1;min-width:0">
        <div class="up-fname">${u.filename}</div>
        <div class="up-meta">${u.success_count} inserted · ${u.error_count} errors · ${formatDate(u.created_at)}</div>
      </div>
      <span class="badge ${badge(u.status)}">${u.status}</span>
    </div>`).join('');
}

loadDashboard();