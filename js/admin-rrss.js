(function () {
  'use strict';

  var SECTION = 'social';
  var KEY = 'pansur_social_cms_v1';
  var LINK_MAX = 300;
  var SAFE_HREF_RE = /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i;
  var DEFAULTS = {
    links: [
      { key: 'facebook', label: 'Facebook', iconClass: 'fa-brands fa-facebook-f', href: '#', enabled: true },
      { key: 'twitter', label: 'X (Twitter)', iconClass: 'fa-brands fa-x-twitter', href: '#', enabled: true },
      { key: 'youtube', label: 'YouTube', iconClass: 'fa-brands fa-youtube', href: '#', enabled: true },
      { key: 'linkedin', label: 'LinkedIn', iconClass: 'fa-brands fa-linkedin-in', href: '#', enabled: true }
    ]
  };

  var state = null;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function sanitizeHref(value) {
    var href = String(value || '').trim();
    if (!href) return '#';
    return SAFE_HREF_RE.test(href) ? href : '#';
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.links)) return null;
    var links = raw.links.map(function (item, idx) {
      var fallback = DEFAULTS.links[idx] || {};
      return {
        key: String(item.key || fallback.key || ''),
        label: String(item.label || fallback.label || '').trim(),
        iconClass: String(item.iconClass || fallback.iconClass || '').trim(),
        href: sanitizeHref(String(item.href || '').trim().slice(0, LINK_MAX)),
        enabled: Boolean(item.enabled)
      };
    }).filter(function (item) { return item.iconClass; });
    if (!links.length) return null;
    return { links: links };
  }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      var valid = normalize(parsed);
      if (valid) return valid;
    } catch (err) {}
    return clone(DEFAULTS);
  }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function render() {
    var list = byId('social-list');
    if (!list) return;
    list.innerHTML = state.links.map(function (item, idx) {
      return '' +
        '<div class="social-item" data-social-index="' + idx + '">' +
          '<div class="row g-3 align-items-center">' +
            '<div class="col-md-3"><label class="form-label mb-0">Red social</label><div>' + escapeHtml(item.label) + '</div></div>' +
            '<div class="col-md-5"><label class="form-label" for="social-link-' + idx + '">Enlace</label><input class="form-control social-link" id="social-link-' + idx + '" type="text" maxlength="' + LINK_MAX + '" value="' + escapeHtml(item.href) + '" placeholder="https://..."></div>' +
            '<div class="col-md-4"><label class="form-label d-block">Mostrar icono</label><div class="form-check"><input class="form-check-input social-enabled" type="checkbox" id="social-enabled-' + idx + '" ' + (item.enabled ? 'checked' : '') + '><label class="form-check-label" for="social-enabled-' + idx + '">Activo</label></div></div>' +
          '</div>' +
        '</div>';
    }).join('');

    list.querySelectorAll('.social-item').forEach(function (row) {
      var idx = Number(row.getAttribute('data-social-index'));
      var linkInput = row.querySelector('.social-link');
      var enabledInput = row.querySelector('.social-enabled');
      linkInput.addEventListener('input', function () {
        state.links[idx].href = sanitizeHref(linkInput.value.slice(0, LINK_MAX));
        linkInput.value = state.links[idx].href;
      });
      enabledInput.addEventListener('change', function () {
        state.links[idx].enabled = enabledInput.checked;
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
    var form = byId('social-cms-form');
    var resetBtn = byId('reset-btn');
    if (!form || !resetBtn) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    state = loadData();
    render();

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var payload = {
        links: state.links.map(function (item) {
          return {
            key: item.key,
            label: item.label,
            iconClass: item.iconClass,
            href: sanitizeHref(String(item.href || '').trim().slice(0, LINK_MAX)),
            enabled: Boolean(item.enabled)
          };
        })
      };
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.saveSection(SECTION, payload);
        } else {
          localStorage.setItem(KEY, JSON.stringify(payload));
        }
        setStatus('Configuracion de redes sociales guardada correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar la configuracion de redes sociales.', false);
      }
    });

    resetBtn.addEventListener('click', async function () {
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.resetSection(SECTION);
          await window.PansurCMS.syncFromServer();
          state = loadData();
        } else {
          localStorage.removeItem(KEY);
          state = clone(DEFAULTS);
        }
        render();
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar la configuracion de redes sociales.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
