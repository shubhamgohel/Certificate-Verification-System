/* =========================================================
   AMDOX — Auth Page JS
   ========================================================= */

createParticles('particles');

// Already logged in? Go to dashboard
if (auth.getToken()) window.location.href = 'admin-dashboard.html';

// Password toggle
const pwToggle = document.getElementById('pwToggle');
const pwInput  = document.getElementById('password');
pwToggle?.addEventListener('click', () => {
  const isText = pwInput.type === 'text';
  pwInput.type = isText ? 'password' : 'text';
  pwToggle.textContent = isText ? '👁' : '🙈';
});

// ── Backend health check with auto-retry ────────────────────
let backendReady = false;

async function checkBackend() {
  try {
    const res = await fetch(CONFIG.API_BASE + '/api/auth/login', {
      method: 'OPTIONS',
    });
    backendReady = true;
    // Hide any backend-down banner
    const banner = document.getElementById('backendBanner');
    if (banner) banner.remove();
    return true;
  } catch {
    backendReady = false;
    return false;
  }
}

// Check immediately and keep retrying every 3s until backend is up
(async function waitForBackend() {
  const ok = await checkBackend();
  if (!ok) {
    // Show a subtle banner only if not already shown
    if (!document.getElementById('backendBanner')) {
      const banner = document.createElement('div');
      banner.id = 'backendBanner';
      banner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;' +
        'background:linear-gradient(90deg,#d4380088,#ff660044);' +
        'color:#ffddaa;text-align:center;padding:10px 16px;font-size:0.85rem;' +
        'font-family:Inter,sans-serif;backdrop-filter:blur(8px);';
      banner.innerHTML =
        '⏳ Waiting for backend server (port 4000)… ' +
        '<span style="opacity:0.7">It will connect automatically once started.</span>';
      document.body.prepend(banner);
    }
    setTimeout(waitForBackend, 3000);
  }
})();

// Login form
document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('loginBtn');
  const btnTxt   = document.getElementById('loginBtnText');
  const spinner  = document.getElementById('loginSpinner');
  const errEl    = document.getElementById('loginError');

  if (!email || !password) { showErr('Please fill in all fields.'); return; }

  btnTxt.textContent = 'Signing in...';
  spinner.classList.remove('hidden');
  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    const { ok, data } = await api.post('/auth/login', { email, password });
    if (ok && data.success) {
      auth.setAuth(data.token, data.admin);
      toast.success('Welcome back, ' + data.admin.name + '!');
      setTimeout(() => { window.location.href = 'admin-dashboard.html'; }, 700);
    } else {
      showErr(data.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    showErr('Cannot reach the backend server. Please start it first:\n1. Open a terminal in the backend folder\n2. Run: npm run dev');
  } finally {
    btnTxt.textContent = 'Sign In';
    spinner.classList.add('hidden');
    btn.disabled = false;
  }
});

function showErr(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.classList.remove('hidden');
  const form = document.getElementById('loginForm');
  form.style.animation = 'none';
  requestAnimationFrame(() => { form.style.animation = 'shake .4s ease'; });
}