const Auth = {
  get token() { return localStorage.getItem('token'); },
  get role() { return localStorage.getItem('role'); },
  get name() { return localStorage.getItem('name'); },
  save(d) { localStorage.setItem('token', d.token); localStorage.setItem('role', d.role); localStorage.setItem('name', d.name); },
  clear() { ['token', 'role', 'name'].forEach(k => localStorage.removeItem(k)); }
};
const SITE = /[\/\\]admin[\/\\]/.test(location.pathname) ? 'admin' : 'member';
const LOGIN = 'login.html';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Makes a value safe to use inside CSS url(...), whatever characters the file name has.
const cssUrl = u => 'url(' + String(u).replace(/[\s"'()\\]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')) + ')';
const hue = t => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

function logout() { Auth.clear(); location.href = LOGIN; }
function guard() { if (!Auth.token || Auth.role !== SITE) logout(); }

async function api(url, opts = {}) {
  if (CONFIG.USE_MOCK) return mockApi(url, opts);
  const headers = { ...(opts.headers || {}) };
  if (Auth.token) headers.Authorization = 'Bearer ' + Auth.token;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts = { ...opts, body: JSON.stringify(opts.body) };
  }
  const res = await fetch(CONFIG.API_BASE + url, { ...opts, headers });
  if (res.status === 401 && Auth.token) logout();
  if (!res.ok) {
    let msg = 'Something went wrong. Try again.';
    try { msg = (await res.json()).error || msg; } catch (e) {}
    throw new Error(msg);
  }
  return res;
}

function toast(msg, bad) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

// PDFs need the login token, so fetch the file and open it as a blob.
async function openPdf(id) {
  const w = window.open('', '_blank');
  try {
    const blob = await (await api('/api/books/' + id + '/pdf')).blob();
    const url = URL.createObjectURL(blob);
    if (w) w.location = url; else location.href = url;
  } catch (e) {
    if (w) w.close();
    toast(e.message, true);
  }
}

// Adds a Show / Hide button to every password box on the page.
function addPasswordToggles() {
  document.querySelectorAll('input[type=password]').forEach(input => {
    const wrap = document.createElement('div');
    wrap.className = 'pw';
    input.replaceWith(wrap);
    wrap.append(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-btn';
    btn.textContent = 'Show';
    btn.setAttribute('aria-label', 'Show or hide password');
    btn.addEventListener('click', () => {
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.textContent = hidden ? 'Hide' : 'Show';
    });
    wrap.append(btn);
  });
}
