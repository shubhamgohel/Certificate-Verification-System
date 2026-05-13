/* =========================================================
   AMDOX — Admin Common JS (runs on every admin page)
   ========================================================= */

// Auth guard — redirect to login if no token
if (!auth.requireAuth()) { throw new Error('Not authenticated'); }

// Populate admin info in sidebar/topbar
const adminData = auth.getAdmin();
if (adminData) {
  const initial = (adminData.name || 'A').charAt(0).toUpperCase();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('adminNameTop',    adminData.name);
  set('adminNameSidebar', adminData.name);
  set('adminAvatarSidebar', initial);
}

// Topbar date
const dateEl = document.getElementById('topbarDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

// Sidebar toggle (mobile)
const sidebar     = document.getElementById('sidebar');
const menuBtn     = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');
menuBtn?.addEventListener('click',      () => sidebar.classList.add('open'));
sidebarClose?.addEventListener('click', () => sidebar.classList.remove('open'));
document.addEventListener('click', e => {
  if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn)
    sidebar.classList.remove('open');
});

// Highlight active nav link
const currentFile = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-item[href]').forEach(item => {
  item.classList.toggle('active', item.getAttribute('href') === currentFile);
});