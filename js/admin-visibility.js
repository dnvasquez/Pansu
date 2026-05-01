(function () {
  'use strict';

  var SECTION = 'visibility';
  var KEY = 'pansur_visibility_cms_v1';
  var DEFAULTS = {
    header: true,
    why: true,
    kpis: true,
    about: true,
    savings: true,
    products: true,
    faq: true,
    contact: true,
    quote: true,
    social: true
  };

  var state = null;
  var storage = window.PansurStorage || window.sessionStorage || window.localStorage;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normalize(raw) {
    var result = clone(DEFAULTS);
    if (!raw || typeof raw !== 'object') return result;
    Object.keys(DEFAULTS).forEach(function (key) {
      if (typeof raw[key] !== 'undefined') result[key] = Boolean(raw[key]);
    });
    return result;
  }

  function loadData() {
    try {
      var parsed = JSON.parse(storage.getItem(KEY) || 'null');
      return normalize(parsed);
    } catch (err) {}
    return clone(DEFAULTS);
  }

  function saveData() {
    var payload = clone(state);
    if (window.PansurCMS) {
      return window.PansurCMS.saveSection(SECTION, payload).then(function () {
        storage.setItem(KEY, JSON.stringify(payload));
        return payload;
      });
    }
    storage.setItem(KEY, JSON.stringify(payload));
    return Promise.resolve(payload);
  }

  function setStatus(message, ok, root) {
    var el = root.querySelector('[data-visibility-status]');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-on', !!ok);
    el.classList.toggle('is-off', !ok);
  }

  function renderTicket(container) {
    var sectionKey = container.getAttribute('data-section-visibility-ticket');
    var enabled = state[sectionKey] !== false;

    container.innerHTML = '' +
      '<div class="admin-visibility ' + (enabled ? 'is-on' : 'is-off') + '">' +
        '<span class="admin-visibility-label">Visibilidad</span>' +
        '<label class="form-check form-switch admin-visibility-switch">' +
          '<input class="form-check-input" type="checkbox" ' + (enabled ? 'checked' : '') + ' aria-label="Visibilidad">' +
        '</label>' +
      '</div>';

    var card = container.querySelector('.admin-visibility');
    var input = container.querySelector('.form-check-input');

    input.addEventListener('change', function () {
      state[sectionKey] = input.checked;
      card.classList.toggle('is-on', input.checked);
      card.classList.toggle('is-off', !input.checked);
      saveData().catch(function () {
        state[sectionKey] = !input.checked;
        input.checked = state[sectionKey];
        card.classList.toggle('is-on', input.checked);
        card.classList.toggle('is-off', !input.checked);
        setStatus('No se pudo guardar la visibilidad.', false, container);
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function init() {
    var widgets = Array.from(document.querySelectorAll('[data-section-visibility-ticket]'));
    if (!widgets.length) return;

    if (window.PansurCMS && typeof window.PansurCMS.syncFromServer === 'function') {
      try {
        await window.PansurCMS.syncFromServer();
      } catch (err) {}
    }

    state = loadData();
    widgets.forEach(renderTicket);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
