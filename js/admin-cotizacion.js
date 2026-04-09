(function () {
  'use strict';

  var KEY = 'pansur_quote_cms_v1';
  var EMAIL_MAX = 120;
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

  function init() {
    var form = byId('quote-cms-form');
    var resetBtn = byId('reset-btn');
    var emailInput = byId('quote-destination-email');
    if (!form || !resetBtn || !emailInput) return;

    emailInput.value = loadData().destinationEmail || DEFAULTS.destinationEmail;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim().slice(0, EMAIL_MAX);
      emailInput.value = email;
      if (!email) {
        setStatus('Debes ingresar un correo destino valido.', false);
        return;
      }
      localStorage.setItem(KEY, JSON.stringify({ destinationEmail: email }));
      setStatus('Correo de destino actualizado correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      emailInput.value = DEFAULTS.destinationEmail;
      setStatus('Se restauraron los valores por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
