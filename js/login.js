Auth.clear();
const portal = document.body.dataset.portal;
const err = $('error');

if (new URLSearchParams(location.search).get('registered')) {
  err.className = 'error ok';
  err.textContent = 'Admin account created. Log in below.';
}

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = ''; err.className = 'error';
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: $('email').value, password: $('password').value, portal }
    });
    Auth.save(await res.json());
    location.href = portal === 'admin' ? 'dashboard.html' : 'library.html';
  } catch (ex) { err.textContent = ex.message; }
});

if ($('signup-form')) {
  let signingUp = false;
  $('switch').addEventListener('click', () => {
    signingUp = !signingUp;
    $('login-form').hidden = signingUp;
    $('signup-form').hidden = !signingUp;
    $('title').textContent = signingUp ? 'Create your account' : 'Welcome back';
    $('switch').textContent = signingUp ? 'Have an account? Log in' : 'New here? Create an account';
    err.textContent = ''; err.className = 'error';
  });
  $('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = ''; err.className = 'error';
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { name: $('s-name').value, email: $('s-email').value, password: $('s-password').value }
      });
      $('email').value = $('s-email').value;
      $('switch').click();
      err.className = 'error ok';
      err.textContent = 'Account created. Log in to start reading.';
    } catch (ex) { err.textContent = ex.message; }
  });
}

addPasswordToggles();
