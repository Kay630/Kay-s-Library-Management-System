const err = $('error');

if (CONFIG.USE_MOCK) {
  $('code-hint').hidden = false;
  $('code-hint').textContent = 'Demo mode: the access code is ' + CONFIG.ADMIN_CODE;
}

$('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = '';
  if ($('password').value !== $('confirm').value) {
    err.textContent = 'The two passwords do not match.';
    return;
  }
  const btn = $('save');
  btn.textContent = 'Creating…'; btn.disabled = true;
  try {
    await api('/api/auth/register-admin', {
      method: 'POST',
      body: { name: $('name').value, email: $('email').value, password: $('password').value, code: $('code').value }
    });
    location.href = 'login.html?registered=1';
  } catch (ex) {
    err.textContent = ex.message;
    btn.textContent = 'Create admin account'; btn.disabled = false;
  }
});

addPasswordToggles();
