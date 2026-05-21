// ===================== CONFIG =====================
const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';
const API = `${API_BASE}/api`;
let authToken = localStorage.getItem('sv_token') || null;
let currentUser = JSON.parse(localStorage.getItem('sv_user') || 'null');
let cart = [];
let prefs = JSON.parse(localStorage.getItem('sv_prefs') || 'null');

// ===================== API HELPERS =====================
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const res = await fetch(`${API}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  } catch (err) {
    console.warn(`[API] ${endpoint} failed:`, err.message);
    return null;
  }
}

// ===================== STATIC FALLBACK DATA =====================
const STATIC_MATCHES = [
  { id:1, sport:'Cricket', league:'IPL 2026', team1:'Mumbai Indians', team2:'Chennai Super Kings', score1:'186/4', score2:'142/6 (16.2)', icon1:'🔵', icon2:'💛', status:'Live', overs:'16.2 ov' },
  { id:2, sport:'Football', league:'Premier League', team1:'Arsenal', team2:'Man City', score1:'2', score2:'1', icon1:'🔴', icon2:'🔵', status:'Live', overs:"72'" },
  { id:3, sport:'Basketball', league:'NBA Playoffs', team1:'LA Lakers', team2:'Boston Celtics', score1:'98', score2:'104', icon1:'💜', icon2:'💚', status:'Live', overs:'Q4 3:22' },
  { id:4, sport:'Tennis', league:'French Open', team1:'C. Alcaraz', team2:'N. Djokovic', score1:'6-4, 3', score2:'3-6, 5', icon1:'🇪🇸', icon2:'🇷🇸', status:'Live', overs:'Set 3' },
];
const STATIC_PRODUCTS = [
  { id:1, name:'MI Home Jersey 2026', team:'Mumbai Indians', sport:'Cricket', price:2499, old_price:3499, image:'/assets/cricket-jersey.png', badge:'trending', context:'🔥 MI batting on fire — 186/4!', tags:['cricket','jersey','mumbai'] },
  { id:2, name:'CSK Dhoni Legend Tee', team:'Chennai Super Kings', sport:'Cricket', price:1999, old_price:2499, image:'/assets/cricket-jersey.png', badge:'live', context:'⚡ CSK vs MI happening now!', tags:['cricket','tshirt','chennai'] },
  { id:3, name:'Arsenal 26/27 Kit', team:'Arsenal', sport:'Football', price:5999, old_price:7499, image:'/assets/football-jersey.png', badge:'trending', context:'⚽ Arsenal leading 2-1 vs City!', tags:['football','jersey','arsenal'] },
  { id:4, name:'Pro Cricket Bat — SS Ton', team:'General', sport:'Cricket', price:8999, old_price:12999, image:'/assets/cricket-bat.jpg', badge:'new', context:'🏏 IPL season — bat demand +340%', tags:['cricket','equipment','bat'] },
  { id:5, name:'Lakers LeBron Jersey #23', team:'LA Lakers', sport:'Basketball', price:4499, old_price:5999, image:'/assets/basketball-jersey.jpg', badge:'live', context:'🏀 Lakers in NBA Playoffs right now!', tags:['basketball','jersey','lakers'] },
  { id:6, name:'Alcaraz Pro Racquet', team:'General', sport:'Tennis', price:15999, old_price:19999, image:'/assets/tennis-racquet.jpg', badge:'trending', context:'🎾 Alcaraz dominating at French Open!', tags:['tennis','equipment','racquet'] },
  { id:7, name:'Man City Away Jersey', team:'Man City', sport:'Football', price:5499, old_price:6999, image:'/assets/football-jersey-blue.jpg', badge:'live', context:'⚽ City chasing at Emirates!', tags:['football','jersey','mancity'] },
  { id:8, name:'NBA Official Basketball', team:'General', sport:'Basketball', price:3999, old_price:4999, image:'/assets/basketball-ball.jpg', badge:'new', context:'🏀 Playoffs fever — ball sales +200%', tags:['basketball','equipment','ball'] },
  { id:9, name:'Celtics Training Shorts', team:'Boston Celtics', sport:'Basketball', price:1799, old_price:2499, image:'/assets/basketball-shorts.jpg', badge:'trending', context:'🏀 Celtics leading in Q4!', tags:['basketball','shorts','celtics'] },
  { id:10, name:'Cricket Training Gloves', team:'General', sport:'Cricket', price:1299, old_price:1799, image:'/assets/cricket-gloves.jpg', badge:'new', context:'🏏 Season essentials — top seller', tags:['cricket','equipment','gloves'] },
  { id:11, name:'Djokovic Signature Shoes', team:'General', sport:'Tennis', price:12499, old_price:15999, image:'/assets/sports-shoes.jpg', badge:'trending', context:'🎾 Djokovic fighting back at RG!', tags:['tennis','footwear','shoes'] },
  { id:12, name:'Arsenal Scarf & Cap Combo', team:'Arsenal', sport:'Football', price:999, old_price:1499, image:'/assets/football-accessories.jpg', badge:'live', context:'⚽ Gunners matchday essentials!', tags:['football','accessory','arsenal'] },
];
const STATIC_TEAMS = [
  { name:'Mumbai Indians', sport:'Cricket', icon:'🔵', color:'linear-gradient(135deg,#004BA0,#00A5E0)', product_count:142 },
  { name:'Chennai Super Kings', sport:'Cricket', icon:'💛', color:'linear-gradient(135deg,#F9CD05,#FF8C00)', product_count:128 },
  { name:'Arsenal', sport:'Football', icon:'🔴', color:'linear-gradient(135deg,#EF0107,#9C824A)', product_count:96 },
  { name:'Man City', sport:'Football', icon:'🔵', color:'linear-gradient(135deg,#6CABDD,#1C2C5B)', product_count:88 },
  { name:'LA Lakers', sport:'Basketball', icon:'💜', color:'linear-gradient(135deg,#552583,#FDB927)', product_count:74 },
  { name:'Boston Celtics', sport:'Basketball', icon:'💚', color:'linear-gradient(135deg,#007A33,#BA9653)', product_count:68 },
  { name:'Real Madrid', sport:'Football', icon:'⚪', color:'linear-gradient(135deg,#FEBE10,#00529F)', product_count:105 },
  { name:'Royal Challengers', sport:'Cricket', icon:'❤️', color:'linear-gradient(135deg,#EC1C24,#2B2A29)', product_count:134 },
  { name:'Golden State Warriors', sport:'Basketball', icon:'💛', color:'linear-gradient(135deg,#1D428A,#FFC72C)', product_count:82 },
  { name:'Barcelona', sport:'Football', icon:'🔵', color:'linear-gradient(135deg,#A50044,#004D98)', product_count:98 },
];
const STATIC_PLAYERS = [
  { name:'Virat Kohli', sport:'Cricket', stat:'87 runs off 49 balls', performance:92, trending_merch:'34 items trending', avatar:'🏏' },
  { name:'Erling Haaland', sport:'Football', stat:'1 Goal, 5 Shots on Target', performance:78, trending_merch:'18 items trending', avatar:'⚽' },
  { name:'LeBron James', sport:'Basketball', stat:'32 pts, 10 reb, 8 ast', performance:88, trending_merch:'26 items trending', avatar:'🏀' },
  { name:'Carlos Alcaraz', sport:'Tennis', stat:'12 Aces, 78% 1st Serve', performance:85, trending_merch:'14 items trending', avatar:'🎾' },
  { name:'Jasprit Bumrah', sport:'Cricket', stat:'3/24 in 4 overs', performance:95, trending_merch:'22 items trending', avatar:'🏏' },
  { name:'Bukayo Saka', sport:'Football', stat:'1 Goal, 2 Assists', performance:82, trending_merch:'15 items trending', avatar:'⚽' },
];
const STATIC_CATEGORIES = [
  { name:'Jerseys', icon:'👕', item_count:'4,200+' },{ name:'Equipment', icon:'🏏', item_count:'2,800+' },
  { name:'Footwear', icon:'👟', item_count:'1,600+' },{ name:'Accessories', icon:'🧢', item_count:'3,100+' },
  { name:'Fan Gear', icon:'📣', item_count:'1,900+' },{ name:'Training', icon:'💪', item_count:'2,400+' },
  { name:'Collectibles', icon:'🏆', item_count:'800+' },{ name:'Nutrition', icon:'🥤', item_count:'650+' },
];
const SPORTS_LIST = ['Cricket','Football','Basketball','Tennis','F1 Racing','Badminton','Swimming','Athletics'];
const INTERESTS = ['Jerseys','Equipment','Footwear','Collectibles','Training Gear','Fan Merchandise','Autographed Items','Limited Editions'];

// ===================== DATA LOADERS (API with fallback) =====================
let matchesData = [], productsData = [], teamsData = [], playersData = [], categoriesData = [];

async function loadData() {
  // Try API first, fallback to static
  const [mRes, pRes, tRes, plRes, cRes] = await Promise.all([
    api('/matches'), api('/products?limit=20'), api('/teams'), api('/players'), api('/categories')
  ]);
  matchesData = mRes?.data || STATIC_MATCHES;
  productsData = (pRes?.data || STATIC_PRODUCTS).map(p => ({ ...p, img: p.image || p.img, oldPrice: p.old_price || p.oldPrice }));
  teamsData = tRes?.data || STATIC_TEAMS;
  playersData = plRes?.data || STATIC_PLAYERS;
  categoriesData = cRes?.data || STATIC_CATEGORIES;
}

// ===================== RENDER FUNCTIONS =====================
function renderTicker() {
  const wrap = document.getElementById('tickerWrap');
  const items = matchesData.map(m => `
    <div class="ticker-item"><span class="live-dot"></span><b>${m.team1}</b> <span class="score">${m.score1}</span> vs <span class="score">${m.score2}</span> <b>${m.team2}</b> · ${m.league} · ${m.overs}</div>
  `).join('');
  wrap.innerHTML = items + items;
}

function renderMatches() {
  document.getElementById('matchesGrid').innerHTML = matchesData.map(m => `
    <div class="match-card">
      <div class="match-header"><span class="match-sport">${m.league}</span><span class="match-live"><span class="live-dot"></span> ${m.status} · ${m.overs}</span></div>
      <div class="match-teams">
        <div class="match-team"><div class="team-icon">${m.icon1}</div><div class="team-name">${m.team1}</div><div class="team-score">${m.score1}</div></div>
        <div class="match-vs">VS</div>
        <div class="match-team"><div class="team-icon">${m.icon2}</div><div class="team-name">${m.team2}</div><div class="team-score">${m.score2}</div></div>
      </div>
      <button class="match-cta" onclick="filterByMatch('${m.team1}','${m.team2}')">🛍️ Shop Match Merch</button>
    </div>
  `).join('');
}

function renderProducts(containerId, products) {
  document.getElementById(containerId).innerHTML = products.map(p => `
    <div class="product-card" id="product-${p.id}">
      <div class="product-img">
        <img src="${p.img || p.image}" alt="${p.name}" loading="lazy">
        <span class="product-badge badge-${p.badge}">${p.badge === 'trending' ? '🔥 Trending' : p.badge === 'live' ? '🟢 Live Event' : '✨ New'}</span>
        <button class="product-wishlist" onclick="event.stopPropagation();toggleWishlist(${p.id})">♡</button>
      </div>
      <div class="product-info">
        <div class="product-context">${p.context || ''}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-team">${p.team} · ${p.sport}</div>
        <div class="product-footer">
          <div class="product-price">₹${p.price.toLocaleString()}<span class="old">₹${(p.oldPrice || p.old_price || 0).toLocaleString()}</span></div>
          <button class="add-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})">+ Add</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderTeams() {
  document.getElementById('teamsGrid').innerHTML = teamsData.map(t => `
    <div class="team-card" onclick="filterByTeam('${t.name}')">
      <div class="team-logo" style="background:${t.color}">${t.icon}</div>
      <h3>${t.name}</h3><p>${t.sport}</p>
      <div class="team-count">${t.product_count} Products →</div>
    </div>
  `).join('');
}

function renderPlayers() {
  document.getElementById('perfGrid').innerHTML = playersData.map(p => `
    <div class="perf-card">
      <div class="perf-avatar">${p.avatar}</div>
      <div class="perf-info" style="flex:1">
        <h3>${p.name}</h3>
        <div class="perf-stat">📊 ${p.stat}</div>
        <div class="perf-merch">🛍️ ${p.trending_merch || p.merch}</div>
        <div class="perf-bar"><div class="perf-bar-fill" style="width:${p.performance || p.perf}%"></div></div>
      </div>
    </div>
  `).join('');
}

function renderCategories() {
  document.getElementById('categoriesGrid').innerHTML = categoriesData.map(c => `
    <div class="category-card">
      <div class="cat-icon">${c.icon}</div>
      <h3>${c.name}</h3><p>${c.item_count} items</p>
    </div>
  `).join('');
}

// ===================== RECOMMENDATIONS =====================
async function loadRecommended() {
  const res = await api('/recommendations?limit=4');
  if (res?.data) {
    renderProducts('forYouGrid', res.data.map(p => ({ ...p, img: p.image, oldPrice: p.old_price })));
  } else {
    const fallback = getLocalRecommended();
    renderProducts('forYouGrid', fallback);
  }
}

function getLocalRecommended() {
  if (!prefs) return productsData.slice(0, 4);
  let scored = productsData.map(p => {
    let score = 0;
    if ((prefs.sports || []).some(s => p.sport.toLowerCase().includes(s.toLowerCase()))) score += 3;
    if ((prefs.teams || []).some(t => (p.team || '').toLowerCase().includes(t.toLowerCase()))) score += 5;
    if (p.badge === 'live') score += 2;
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4);
}

async function loadTrending() {
  const res = await api('/products/trending');
  if (res?.data) {
    renderProducts('trendingGrid', res.data.map(p => ({ ...p, img: p.image, oldPrice: p.old_price })));
  } else {
    renderProducts('trendingGrid', productsData.filter(p => p.badge === 'trending' || p.badge === 'live').slice(0, 4));
  }
}

// ===================== CART =====================
async function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;
  if (authToken) {
    await api('/cart', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
  }
  // Also maintain local cart
  const existing = cart.find(c => c.id === productId);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  renderCart();
  showToast(`✅ ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  saveCart(); renderCart();
}

function updateQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(productId);
  saveCart(); renderCart();
}

function saveCart() {
  localStorage.setItem('sv_cart', JSON.stringify(cart));
  document.getElementById('cartCount').textContent = cart.reduce((s, c) => s + (c.qty || 1), 0);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalDiv = document.getElementById('cartTotal');
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>';
    totalDiv.innerHTML = ''; return;
  }
  container.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${c.img || c.image}" alt="${c.name}"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-price">₹${c.price.toLocaleString()}</div>
        <div class="cart-item-qty"><button onclick="updateQty(${c.id},-1)">−</button><span>${c.qty}</span><button onclick="updateQty(${c.id},1)">+</button></div>
        <button class="cart-item-remove" onclick="removeFromCart(${c.id})">Remove</button>
      </div>
    </div>
  `).join('');
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discount = Math.round(subtotal * 0.1);
  totalDiv.innerHTML = `
    <div class="cart-total-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
    <div class="cart-total-row"><span>Fan Discount (10%)</span><span style="color:var(--success)">-₹${discount.toLocaleString()}</span></div>
    <div class="cart-total-row"><span>Delivery</span><span style="color:var(--success)">FREE</span></div>
    <div class="cart-total-row final"><span>Total</span><span>₹${(subtotal - discount).toLocaleString()}</span></div>
    <button class="checkout-btn" onclick="checkout()">Checkout →</button>
  `;
}

async function checkout() {
  if (authToken) {
    const res = await api('/cart/checkout', { method: 'POST', body: JSON.stringify({}) });
    if (res?.success) { cart = []; saveCart(); renderCart(); showToast(`🎉 ${res.message} Order #${res.data.order_id}`); return; }
  }
  cart = []; saveCart(); renderCart();
  showToast('🎉 Order placed successfully! Thank you!');
}

// ===================== WISHLIST =====================
async function toggleWishlist(productId) {
  if (authToken) { await api('/recommendations/wishlist', { method: 'POST', body: JSON.stringify({ product_id: productId }) }); }
  showToast('Added to wishlist ❤️');
}

// ===================== PREFERENCES =====================
function renderPrefModal() {
  document.getElementById('sportsPref').innerHTML = SPORTS_LIST.map(s => `<div class="pref-chip ${prefs?.sports?.includes(s)?'selected':''}" data-type="sports" data-val="${s}">${s}</div>`).join('');
  document.getElementById('teamsPref').innerHTML = teamsData.map(t => `<div class="pref-chip ${prefs?.teams?.includes(t.name)?'selected':''}" data-type="teams" data-val="${t.name}">${t.icon} ${t.name}</div>`).join('');
  document.getElementById('interestsPref').innerHTML = INTERESTS.map(i => `<div class="pref-chip ${prefs?.interests?.includes(i)?'selected':''}" data-type="interests" data-val="${i}">${i}</div>`).join('');
  document.querySelectorAll('.pref-chip').forEach(chip => chip.addEventListener('click', () => chip.classList.toggle('selected')));
}

async function savePrefs() {
  const sports = [...document.querySelectorAll('[data-type="sports"].selected')].map(e => e.dataset.val);
  const teams = [...document.querySelectorAll('[data-type="teams"].selected')].map(e => e.dataset.val);
  const interests = [...document.querySelectorAll('[data-type="interests"].selected')].map(e => e.dataset.val);
  prefs = { sports, teams, interests };
  localStorage.setItem('sv_prefs', JSON.stringify(prefs));
  if (authToken) await api('/auth/preferences', { method: 'PUT', body: JSON.stringify(prefs) });
  document.getElementById('prefModal').classList.remove('active');
  await loadRecommended();
  showToast('✅ Preferences saved! Recommendations updated.');
}

// ===================== FILTERS =====================
function filterByMatch(team1, team2) {
  const filtered = productsData.filter(p => p.team === team1 || p.team === team2);
  renderProducts('trendingGrid', filtered.length ? filtered : productsData.slice(0, 4));
  document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
  showToast(`Showing merch for ${team1} vs ${team2}`);
}
function filterByTeam(teamName) {
  const filtered = productsData.filter(p => p.team === teamName);
  renderProducts('trendingGrid', filtered.length ? filtered : productsData.slice(0, 4));
  document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
  showToast(`Showing ${teamName} merchandise`);
}

// ===================== SEARCH =====================
document.getElementById('searchInput').addEventListener('input', async function() {
  const q = this.value.toLowerCase().trim();
  if (!q) { await loadTrending(); return; }
  const res = await api(`/products?search=${encodeURIComponent(q)}`);
  if (res?.data?.length) {
    renderProducts('trendingGrid', res.data.map(p => ({ ...p, img: p.image, oldPrice: p.old_price })));
  } else {
    const local = productsData.filter(p => p.name.toLowerCase().includes(q) || (p.team||'').toLowerCase().includes(q) || p.sport.toLowerCase().includes(q));
    renderProducts('trendingGrid', local);
  }
  document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
});

// ===================== UI & TOAST =====================
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
document.getElementById('cartToggle').addEventListener('click', () => { document.getElementById('cartSidebar').classList.add('open'); document.getElementById('cartOverlay').classList.add('open'); });
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);
function closeCart() { document.getElementById('cartSidebar').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); }
document.getElementById('openPrefs').addEventListener('click', e => { e.preventDefault(); openPrefModal(); });
document.getElementById('userBtn').addEventListener('click', openPrefModal);
function openPrefModal() { renderPrefModal(); document.getElementById('prefModal').classList.add('active'); }
document.getElementById('prefModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.remove('active'); });
document.getElementById('savePrefs').addEventListener('click', savePrefs);

// ===================== AUTH UI =====================
function updateAuthUI() {
  const btn = document.getElementById('userBtn');
  if (currentUser) { btn.textContent = currentUser.name?.charAt(0).toUpperCase() || 'U'; btn.title = currentUser.name; }
}

// ===================== LIVE UPDATES =====================
async function refreshLiveData() {
  const res = await api('/matches');
  if (res?.data) { matchesData = res.data; renderTicker(); renderMatches(); }
}

// ===================== SCROLL ANIMATIONS =====================
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
}, { threshold: 0.1 });
function observeSections() {
  document.querySelectorAll('section:not(.hero)').forEach(s => {
    s.style.opacity = '0'; s.style.transform = 'translateY(30px)'; s.style.transition = 'opacity .6s ease, transform .6s ease';
    observer.observe(s);
  });
}

// ===================== INIT =====================
async function init() {
  // Load local cart
  cart = JSON.parse(localStorage.getItem('sv_cart') || '[]');
  saveCart();
  // Load data from API (with fallback)
  await loadData();
  renderTicker();
  renderMatches();
  await loadTrending();
  await loadRecommended();
  renderTeams();
  renderPlayers();
  renderCategories();
  renderCart();
  updateAuthUI();
  observeSections();
  // Live updates every 10s
  setInterval(refreshLiveData, 10000);
  // Show prefs modal for new users
  if (!prefs) setTimeout(() => document.getElementById('prefModal').classList.add('active'), 2000);
}
init();
