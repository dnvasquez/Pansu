(function () {
  'use strict';

  var SECTION = 'quote';
  var KEY = 'pansur_quote_cms_v1';
  var EMAIL_MAX = 120;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var DEFAULTS = {
    destinationEmail: 'ventas@pansur.cl'
  };

  function byId(id) { return document.getElementById(id); }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (parsed && typeof parsed.destinationEmail === 'string' && parsed.destinationEmail.trim()) return parsed;
    } catch (err) {}
    return DEFAULTS;
  }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  async function init() {
    var form = byId('quote-cms-form');
    var resetBtn = byId('reset-btn');
    var emailInput = byId('quote-destination-email');
    if (!form || !resetBtn || !emailInput) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    emailInput.value = loadData().destinationEmail || DEFAULTS.destinationEmail;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim().slice(0, EMAIL_MAX);
      emailInput.value = email;
      if (!EMAIL_RE.test(email)) {
        setStatus('Debes ingresar un correo destino valido.', false);
        return;
      }
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.saveSection(SECTION, { destinationEmail: email });
        } else {
          localStorage.setItem(KEY, JSON.stringify({ destinationEmail: email }));
        }
        setStatus('Correo de destino actualizado correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar el correo destino.', false);
      }
    });

    resetBtn.addEventListener('click', async function () {
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.resetSection(SECTION);
          await window.PansurCMS.syncFromServer();
          emailInput.value = loadData().destinationEmail || DEFAULTS.destinationEmail;
        } else {
          localStorage.removeItem(KEY);
          emailInput.value = DEFAULTS.destinationEmail;
        }
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar el correo destino.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
