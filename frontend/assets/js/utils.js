/* =========================================================
   AMDOX — Global Utilities
   ========================================================= */

const CONFIG = {
  // Always points to backend on port 4000 for local dev.
  // On Vercel (production) both are same origin so use ''.
  API_BASE: (function() {
    const h = window.location.hostname;
    const isLocal = h === 'localhost' || h === '127.0.0.1';
    return isLocal ? 'http://localhost:4000' : '';
  })(),
};

/* ── API helper ──────────────────────────────────────────── */
const api = {
  async req(endpoint, opts = {}) {
    const token = localStorage.getItem('amdox_token');
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(CONFIG.API_BASE + '/api' + endpoint, { ...opts, headers });
      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem('amdox_token');
        localStorage.removeItem('amdox_admin');
        if (!window.location.pathname.includes('admin-login'))
          window.location.href = getAdminLoginPath();
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },
  get:    (e)    => api.req(e, { method: 'GET' }),
  post:   (e, b) => api.req(e, { method: 'POST',   body: JSON.stringify(b) }),
  patch:  (e, b) => api.req(e, { method: 'PATCH',  body: JSON.stringify(b) }),
  delete: (e, b) => api.req(e, { method: 'DELETE', body: JSON.stringify(b) }),
  async upload(endpoint, formData) {
    const token = localStorage.getItem('amdox_token');
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(CONFIG.API_BASE + '/api' + endpoint, {
        method: 'POST', headers, body: formData,
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('Upload Error:', err);
      throw err;
    }
  },
};

function getAdminLoginPath() {
  return window.location.pathname.includes('/pages/')
    ? 'admin-login.html'
    : 'pages/admin-login.html';
}

/* ── Auth ────────────────────────────────────────────────── */
const auth = {
  getToken: () => localStorage.getItem('amdox_token'),
  getAdmin: () => {
    try { return JSON.parse(localStorage.getItem('amdox_admin')); }
    catch { return null; }
  },
  setAuth(token, admin) {
    localStorage.setItem('amdox_token', token);
    localStorage.setItem('amdox_admin', JSON.stringify(admin));
  },
  logout() {
    localStorage.removeItem('amdox_token');
    localStorage.removeItem('amdox_admin');
    window.location.href = getAdminLoginPath();
  },
  requireAuth() {
    if (!this.getToken()) {
      window.location.href = getAdminLoginPath();
      return false;
    }
    return true;
  },
};

/* ── Toast ───────────────────────────────────────────────── */
const toast = {
  _c: null,
  init() {
    if (!this._c) {
      this._c = document.createElement('div');
      this._c.id = 'toast-container';
      document.body.appendChild(this._c);
    }
  },
  show(msg, type = 'info', dur = 4000) {
    this.init();
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = `<span style="font-size:1.1rem">${icons[type]}</span><span>${msg}</span>`;
    this._c.appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    }, dur);
  },
  success: (m, d) => toast.show(m, 'success', d),
  error:   (m, d) => toast.show(m, 'error', d),
  warning: (m, d) => toast.show(m, 'warning', d),
  info:    (m, d) => toast.show(m, 'info', d),
};

/* ── Page Loader ─────────────────────────────────────────── */
function hidePageLoader() {
  const l = document.getElementById('page-loader');
  if (l) { l.classList.add('hidden'); setTimeout(() => l.remove(), 500); }
}

/* ── Particles ───────────────────────────────────────────── */
function createParticles(id) {
  const c = document.getElementById(id);
  if (!c) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;bottom:-10px;` +
      `width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;` +
      `animation-duration:${Math.random()*15+10}s;` +
      `animation-delay:${Math.random()*10}s;` +
      `opacity:${Math.random()*.5+.1}`;
    c.appendChild(p);
  }
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function debounce(fn, ms = 400) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Copy failed');
  }
}

/* ── Scroll animations ───────────────────────────────────── */
function initScrollAnim() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-anim').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity .7s ease, transform .7s ease';
    obs.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  hidePageLoader();
  initScrollAnim();
});