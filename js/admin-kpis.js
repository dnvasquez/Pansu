(function () {
  'use strict';

  var KEY = 'pansur_kpis_cms_v1';
  var MAX_ITEMS = 4;
  var MIN_ITEMS = 1;
  var ICON_MAX = 80;
  var VALUE_MAX = 18;
  var LABEL_MAX = 70;

  var DEFAULTS = {
    items: [
      { iconClass: 'fa-solid fa-solar-panel', value: '1.250+', label: 'Instalaciones realizadas' },
      { iconClass: 'fa-solid fa-house-chimney', value: '980+', label: 'Hogares con energia solar' },
      { iconClass: 'fa-solid fa-building', value: '270+', label: 'Proyectos comerciales' },
      { iconClass: 'fa-solid fa-bolt', value: '32%', label: 'Ahorro promedio anual' }
    ]
  };

  var state = null;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
    var items = raw.items.map(function (item) {
      return {
        iconClass: String((item && item.iconClass) || '').trim().slice(0, ICON_MAX),
        value: String((item && item.value) || '').trim().slice(0, VALUE_MAX),
        label: String((item && item.label) || '').trim().slice(0, LABEL_MAX)
      };
    }).filter(function (item) {
      return item.value && item.label;
    }).slice(0, MAX_ITEMS);
    if (items.length < MIN_ITEMS) return null;
    return { items: items };
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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function itemTemplate(item, idx) {
    return '' +
      '<div class="kpi-item" data-kpi-index="' + idx + '">' +
        '<div class="d-flex justify-content-between align-items-center mb-3">' +
          '<h3 class="h6 m-0">KPI ' + (idx + 1) + '</h3>' +
          '<button class="btn btn-outline-danger btn-sm kpi-remove-btn" type="button">Eliminar</button>' +
        '</div>' +
        '<div class="row g-3">' +
          '<div class="col-md-5">' +
            '<label class="form-label" for="kpi-icon-' + idx + '">Icono (clase Font Awesome)</label>' +
            '<input class="form-control kpi-icon" id="kpi-icon-' + idx + '" type="text" maxlength="' + ICON_MAX + '" value="' + escapeHtml(item.iconClass) + '">' +
          '</div>' +
          '<div class="col-md-3">' +
            '<label class="form-label" for="kpi-value-' + idx + '">Valor</label>' +
            '<input class="form-control kpi-value" id="kpi-value-' + idx + '" type="text" maxlength="' + VALUE_MAX + '" value="' + escapeHtml(item.value) + '">' +
          '</div>' +
          '<div class="col-md-4">' +
            '<label class="form-label" for="kpi-label-' + idx + '">Etiqueta</label>' +
            '<input class="form-control kpi-label" id="kpi-label-' + idx + '" type="text" maxlength="' + LABEL_MAX + '" value="' + escapeHtml(item.label) + '">' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function bindItemRow(row) {
    var idx = Number(row.getAttribute('data-kpi-index'));
    var iconInput = row.querySelector('.kpi-icon');
    var valueInput = row.querySelector('.kpi-value');
    var labelInput = row.querySelector('.kpi-label');
    var removeBtn = row.querySelector('.kpi-remove-btn');

    iconInput.addEventListener('input', function () {
      state.items[idx].iconClass = iconInput.value.slice(0, ICON_MAX);
      iconInput.value = state.items[idx].iconClass;
    });
    valueInput.addEventListener('input', function () {
      state.items[idx].value = valueInput.value.slice(0, VALUE_MAX);
      valueInput.value = state.items[idx].value;
    });
    labelInput.addEventListener('input', function () {
      state.items[idx].label = labelInput.value.slice(0, LABEL_MAX);
      labelInput.value = state.items[idx].label;
    });

    removeBtn.addEventListener('click', function () {
      if (state.items.length <= MIN_ITEMS) {
        setStatus('Debes mantener al menos 1 KPI.', false);
        return;
      }
      state.items.splice(idx, 1);
      render();
      setStatus('KPI eliminado.', true);
    });
  }

  function render() {
    var wrap = byId('kpis-list');
    if (!wrap) return;
    wrap.innerHTML = state.items.map(function (item, idx) {
      return itemTemplate(item, idx);
    }).join('');
    wrap.querySelectorAll('[data-kpi-index]').forEach(bindItemRow);
    setStatus('Actualmente tienes ' + state.items.length + ' KPI(s).', true);
  }

  function addKpi() {
    if (state.items.length >= MAX_ITEMS) {
      setStatus('Puedes agregar como maximo 4 KPIs.', false);
      return;
    }
    state.items.push({
      iconClass: 'fa-solid fa-chart-line',
      value: '0',
      label: 'Nuevo KPI'
    });
    render();
  }

  function init() {
    var form = byId('kpis-cms-form');
    var addBtn = byId('add-kpi-btn');
    var resetBtn = byId('reset-btn');
    if (!form || !addBtn || !resetBtn) return;

    state = loadData();
    render();

    addBtn.addEventListener('click', addKpi);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = {
        items: state.items.map(function (item, idx) {
          var fallback = DEFAULTS.items[idx] || DEFAULTS.items[0];
          return {
            iconClass: String(item.iconClass || '').trim().slice(0, ICON_MAX) || fallback.iconClass,
            value: String(item.value || '').trim().slice(0, VALUE_MAX) || fallback.value,
            label: String(item.label || '').trim().slice(0, LABEL_MAX) || fallback.label
          };
        }).filter(function (item) {
          return item.value && item.label;
        }).slice(0, MAX_ITEMS)
      };

      if (payload.items.length < MIN_ITEMS) {
        setStatus('Debes mantener al menos 1 KPI valido.', false);
        return;
      }

      localStorage.setItem(KEY, JSON.stringify(payload));
      setStatus('KPIs actualizados correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      state = clone(DEFAULTS);
      render();
      setStatus('Se restauraron los KPIs por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
