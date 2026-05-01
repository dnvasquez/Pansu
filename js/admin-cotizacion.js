(function () {
  'use strict';

  var SECTION = 'quote';
  var KEY = 'pansur_quote_cms_v1';
  var EMAIL_MAX = 120;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var REGIONS = [
    'Arica y Parinacota',
    'Tarapaca',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaiso',
    "Libertador General Bernardo O'Higgins",
    'Maule',
    'Biobio',
    'Araucania',
    'Los Rios',
    'Los Lagos',
    'Aysen',
    'Magallanes y Antartica Chilena',
    'Metropolitana de Santiago'
  ];
  var DEFAULTS = {
    destinationEmail: 'ventas@pansur.cl',
    enabledRegions: REGIONS.slice()
  };

  function byId(id) { return document.getElementById(id); }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (parsed && typeof parsed.destinationEmail === 'string' && parsed.destinationEmail.trim()) {
        return {
          destinationEmail: parsed.destinationEmail,
          enabledRegions: normalizeRegions(parsed.enabledRegions)
        };
      }
    } catch (err) {}
    return {
      destinationEmail: DEFAULTS.destinationEmail,
      enabledRegions: DEFAULTS.enabledRegions.slice()
    };
  }

  function normalizeRegions(rawRegions) {
    if (!Array.isArray(rawRegions)) return REGIONS.slice();
    var selected = rawRegions;
    var seen = {};
    var normalized = [];

    selected.forEach(function (region) {
      var value = String(region || '').trim();
      if (!value || REGIONS.indexOf(value) === -1 || seen[value]) return;
      seen[value] = true;
      normalized.push(value);
    });

    return REGIONS.filter(function (region) {
      return normalized.indexOf(region) !== -1;
    });
  }

  function renderRegions(container, selectedRegions) {
    if (!container) return;
    var active = new Set(selectedRegions);
    container.innerHTML = REGIONS.map(function (region, idx) {
      var id = 'quote-region-' + idx;
      var checked = active.has(region) ? ' checked' : '';
      return '' +
        '<div class="col-12 col-sm-6 col-lg-4">' +
          '<div class="form-check mb-0">' +
          '<input class="form-check-input quote-region-check" type="checkbox" id="' + id + '" value="' + region.replace(/"/g, '&quot;') + '"' + checked + '>' +
          '<label class="form-check-label" for="' + id + '">' + region + '</label>' +
          '</div>' +
        '</div>';
    }).join('');
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
    var regionsList = byId('quote-regions-list');
    var selectAllBtn = byId('select-all-regions');
    var clearAllBtn = byId('clear-all-regions');
    if (!form || !resetBtn || !emailInput || !regionsList || !selectAllBtn || !clearAllBtn) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    var initialData = loadData();
    emailInput.value = initialData.destinationEmail || DEFAULTS.destinationEmail;
    renderRegions(regionsList, Array.isArray(initialData.enabledRegions) ? initialData.enabledRegions : DEFAULTS.enabledRegions);

    selectAllBtn.addEventListener('click', function () {
      renderRegions(regionsList, REGIONS);
    });

    clearAllBtn.addEventListener('click', function () {
      renderRegions(regionsList, []);
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim().slice(0, EMAIL_MAX);
      var enabledRegions = Array.from(regionsList.querySelectorAll('.quote-region-check:checked')).map(function (input) {
        return input.value;
      });
      emailInput.value = email;
      if (!EMAIL_RE.test(email)) {
        setStatus('Debes ingresar un correo destino valido.', false);
        return;
      }
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.saveSection(SECTION, {
            destinationEmail: email,
            enabledRegions: normalizeRegions(enabledRegions)
          });
        } else {
          localStorage.setItem(KEY, JSON.stringify({
            destinationEmail: email,
            enabledRegions: normalizeRegions(enabledRegions)
          }));
        }
        setStatus('Cotizacion actualizada correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar la configuracion de cotizacion.', false);
      }
    });

    resetBtn.addEventListener('click', async function () {
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.resetSection(SECTION);
          await window.PansurCMS.syncFromServer();
        } else {
          localStorage.removeItem(KEY);
        }
        var resetData = loadData();
        emailInput.value = resetData.destinationEmail || DEFAULTS.destinationEmail;
        renderRegions(regionsList, Array.isArray(resetData.enabledRegions) ? resetData.enabledRegions : DEFAULTS.enabledRegions);
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar la configuracion de cotizacion.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
