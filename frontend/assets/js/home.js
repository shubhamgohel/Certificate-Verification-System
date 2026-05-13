/* ============================================================
   AMDOX - Home Page JS
   ============================================================ */

// ── Navbar Scroll Effect ────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ── Mobile Menu ─────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
navToggle?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── Particles ───────────────────────────────────────────────
createParticles('particles');

// ── Counter Animation ───────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || (target === 100 ? '%' : '+');
    let count = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = Math.floor(count) + suffix;
      if (count >= target) clearInterval(timer);
    }, 25);
  });
}

// Trigger counter when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    animateCounters();
    heroObserver.disconnect();
  }
}, { threshold: 0.3 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// ── Certificate Verification ────────────────────────────────
const certIdInput = document.getElementById('certIdInput');
const searchBtn = document.getElementById('searchBtn');
const searchBtnText = document.getElementById('searchBtnText');
const searchSpinner = document.getElementById('searchSpinner');
const searchResult = document.getElementById('searchResult');

// Allow pressing Enter to search
certIdInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') verifyCertificate();
});

// Auto-uppercase as user types
certIdInput?.addEventListener('input', (e) => {
  const pos = e.target.selectionStart;
  e.target.value = e.target.value.toUpperCase();
  e.target.setSelectionRange(pos, pos);
});

async function verifyCertificate() {
  const rawInput = certIdInput.value.trim();
  if (!rawInput) {
    certIdInput.focus();
    toast.warning('Please enter a Certificate ID');
    certIdInput.style.borderColor = 'var(--error)';
    setTimeout(() => certIdInput.style.borderColor = '', 2000);
    return;
  }

  // Build full cert ID — if user already typed AMDOX- prefix, don't double it
  const fullId = rawInput.startsWith('AMDOX-') ? rawInput : `AMDOX-${rawInput}`;

  // Loading state
  searchBtnText.textContent = 'Verifying...';
  searchSpinner.classList.remove('hidden');
  searchBtn.disabled = true;
  searchResult.innerHTML = '';

  try {
    const { ok, data } = await api.get(`/certificates/verify?id=${encodeURIComponent(fullId)}`);

    if (ok && data.success) {
      renderSuccessResult(data.certificate);
    } else {
      renderErrorResult(data.message || 'Certificate not found');
    }
  } catch (err) {
    renderErrorResult('Network error. Please check your connection and try again.');
  } finally {
    searchBtnText.textContent = 'Verify Now';
    searchSpinner.classList.add('hidden');
    searchBtn.disabled = false;
  }
}

function renderSuccessResult(cert) {
  searchResult.innerHTML = `
    <div class="result-success">
      <div class="result-header">
        <div>
          <div class="result-verified-badge">✓ Certificate Verified</div>
          <div style="margin-top:8px;font-size:0.8rem;color:var(--navy-200);">ID: <span style="font-family:var(--font-mono);color:var(--gold-400)">${cert.certificate_id}</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${cert.certificate_id}')">📋 Copy ID</button>
      </div>

      <div class="result-grid">
        <div class="result-field">
          <label>Student Name</label>
          <div class="val" style="font-family:var(--font-display);font-size:1.1rem;color:var(--gold-300)">${cert.student_name}</div>
        </div>
        <div class="result-field">
          <label>Internship Domain</label>
          <div class="val">${cert.domain}</div>
        </div>
        <div class="result-field">
          <label>Start Date</label>
          <div class="val">${cert.start_date}</div>
        </div>
        <div class="result-field">
          <label>End Date</label>
          <div class="val">${cert.end_date}</div>
        </div>
        ${cert.duration ? `<div class="result-field"><label>Duration</label><div class="val">${cert.duration}</div></div>` : ''}
        <div class="result-field">
          <label>Grade</label>
          <div class="val"><span class="badge badge-gold">${cert.grade}</span></div>
        </div>
        <div class="result-field">
          <label>Issued By</label>
          <div class="val">${cert.issued_by}</div>
        </div>
        <div class="result-field">
          <label>Issue Date</label>
          <div class="val">${cert.issued_on}</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" onclick="viewCertificate(${JSON.stringify(cert).replace(/"/g, '&quot;')})">
          👁 View Certificate
        </button>
        <button class="btn btn-outline" onclick="downloadCertificate(${JSON.stringify(cert).replace(/"/g, '&quot;')})">
          ⬇ Download PDF
        </button>
      </div>
    </div>
  `;
  // Store cert data for the certificate page
  sessionStorage.setItem('cert_data', JSON.stringify(cert));
}

function renderErrorResult(message) {
  searchResult.innerHTML = `
    <div class="result-error">
      <div style="font-size:2.5rem;margin-bottom:12px;">🔍</div>
      <h4 style="color:var(--error);margin-bottom:8px;">Certificate Not Found</h4>
      <p style="font-size:0.88rem;color:var(--navy-100);">${message}</p>
      <p style="font-size:0.8rem;color:var(--navy-200);margin-top:12px;">
        Make sure you enter the correct Certificate ID as printed on your certificate.
        Contact <a href="mailto:info@amdox.in" style="color:var(--gold-400)">info@amdox.in</a> if the issue persists.
      </p>
    </div>
  `;
}

function viewCertificate(cert) {
  sessionStorage.setItem('cert_data', JSON.stringify(cert));
  window.open('pages/certificate.html', '_blank');
}

function downloadCertificate(cert) {
  sessionStorage.setItem('cert_data', JSON.stringify(cert));
  // Open certificate page which will auto-trigger download
  const win = window.open('pages/certificate.html?download=true', '_blank');
}

// ── Smooth Scroll for anchor links ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
