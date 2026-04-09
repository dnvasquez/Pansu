(function () {
  'use strict';

  var SECTION = 'savings';
  var KEY = 'pansur_savings_cms_v1';
  var DEFAULTS = {
    defaultKwh: 320,
    defaultBill: 85000,
    coverageMin: 20,
    coverageMax: 95,
    coverageStep: 5,
    coverageDefault: 60
  };

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function toPositiveInt(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var data = {
      defaultKwh: toPositiveInt(raw.defaultKwh, DEFAULTS.defaultKwh),
      defaultBill: toPositiveInt(raw.defaultBill, DEFAULTS.defaultBill),
      coverageMin: toPositiveInt(raw.coverageMin, DEFAULTS.coverageMin),
      coverageMax: toPositiveInt(raw.coverageMax, DEFAULTS.coverageMax),
      coverageStep: toPositiveInt(raw.coverageStep, DEFAULTS.coverageStep),
      coverageDefault: toPositiveInt(raw.coverageDefault, DEFAULTS.coverageDefault)
    };
    if (data.coverageMin >= data.coverageMax) return null;
    if (data.coverageStep > (data.coverageMax - data.coverageMin)) return null;
    if (data.coverageDefault < data.coverageMin) data.coverageDefault = data.coverageMin;
    if (data.coverageDefault > data.coverageMax) data.coverageDefault = data.coverageMax;
    return data;
  }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      var valid = normalize(parsed);
      if (valid) return valid;
    } catch (err) {}
    return clone(DEFAULTS);
  }

  function fill(data) {
    byId('default-kwh').value = String(data.defaultKwh || '');
    byId('default-bill').value = String(data.defaultBill || '');
    byId('coverage-min').value = String(data.coverageMin || '');
    byId('coverage-max').value = String(data.coverageMax || '');
    byId('coverage-step').value = String(data.coverageStep || '');
    byId('coverage-default').value = String(data.coverageDefault || '');
  }

  function collect() {
    var raw = {
      defaultKwh: byId('default-kwh').value,
      defaultBill: byId('default-bill').value,
      coverageMin: byId('coverage-min').value,
      coverageMax: byId('coverage-max').value,
      coverageStep: byId('coverage-step').value,
      coverageDefault: byId('coverage-default').value
    };
    var data = normalize(raw);
    if (!data) {
      setStatus('Revisa los valores: minimo < maximo, paso valido y valor inicial dentro del rango.', false);
      return null;
    }
    return data;
  }

  async function init() {
    var form = byId('savings-cms-form');
    var resetBtn = byId('reset-btn');
    if (!form || !resetBtn) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    fill(loadData());

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = collect();
      if (!data) return;
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.saveSection(SECTION, data);
        } else {
          localStorage.setItem(KEY, JSON.stringify(data));
        }
        setStatus('Configuracion de calculadora guardada correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar la configuracion de la calculadora.', false);
      }
    });

    resetBtn.addEventListener('click', async function () {
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.resetSection(SECTION);
          await window.PansurCMS.syncFromServer();
          fill(loadData());
        } else {
          localStorage.removeItem(KEY);
          fill(clone(DEFAULTS));
        }
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar la calculadora.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
