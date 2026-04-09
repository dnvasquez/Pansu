(function () {
  'use strict';

  function ensureLogoutButton() {
    var nav = document.querySelector('.admin-nav');
    if (!nav || nav.querySelector('[data-admin-logout]')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Cerrar sesion';
    button.setAttribute('data-admin-logout', 'true');
    button.style.marginTop = '8px';
    button.style.padding = '10px 12px';
    button.style.borderRadius = '8px';
    button.style.border = '1px solid #2f6a3a';
    button.style.background = '#142318';
    button.style.color = '#ffffff';
    button.style.textAlign = 'left';
    button.style.cursor = 'pointer';
    nav.appendChild(button);

    button.addEventListener('click', function () {
      window.PansurCMS.logout().catch(function () {
        window.location.href = '/login.html';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.PansurCMS) return;
    window.PansurCMS.requireAuth()
      .then(function (authenticated) {
        if (!authenticated) return;
        ensureLogoutButton();
      })
      .catch(function () {
        window.location.href = '/login.html';
      });
  });
})();
