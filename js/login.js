(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var status = document.getElementById('status');
  var params = new URLSearchParams(window.location.search);
  var next = params.get('next') || '/admin-header.html';
  var isFileProtocol = window.location.protocol === 'file:';

  if (!form || !status) return;

  if (window.PansurCMS) {
    window.PansurCMS.getSession().then(function (session) {
      if (session && session.csrfToken && window.PansurCMS.setCsrfToken) {
        window.PansurCMS.setCsrfToken(session.csrfToken);
      }
      if (session && session.authenticated) {
        window.location.href = next;
      }
    }).catch(function () {});
  }

  if (isFileProtocol) {
    status.textContent = 'Debes abrir el login desde el servidor local, por ejemplo http://127.0.0.1:3000/login.html.';
    status.style.color = '#b02020';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    status.textContent = '';

    var username = (document.getElementById('username').value || '').trim();
    var password = document.getElementById('password').value || '';
    if (!username || !password) {
      status.textContent = 'Completa usuario y clave.';
      status.style.color = '#b02020';
      return;
    }

    try {
      var res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password, next: next })
      });
      var data = await res.json().catch(function () { return null; });
      if (data && data.csrfToken && window.PansurCMS && window.PansurCMS.setCsrfToken) {
        window.PansurCMS.setCsrfToken(data.csrfToken);
      }
      if (!res.ok || !data || !data.ok) {
        status.textContent = (data && data.message) || 'No se pudo iniciar sesion.';
        status.style.color = '#b02020';
        return;
      }
      window.location.href = data.redirect || '/admin-header.html';
    } catch (err) {
      status.textContent = isFileProtocol
        ? 'No hay servidor activo. Abre el sitio desde http://127.0.0.1:3000/login.html.'
        : 'Error de conexion. Verifica la configuracion del sitio en Netlify.';
      status.style.color = '#b02020';
    }
  });
})();
