(function () {
  'use strict';

  var SECTION = 'why';
  var KEY = 'pansur_why_cms_v1';
  var CAPTION_MAX = 220;
  var ICON_MAX = 80;
  var TITLE_MAX = 70;
  var DESC_MAX = 220;
  var DEFAULTS = {
    caption: 'Descubre los principales beneficios de trabajar con nosotros en cada etapa de tu proyecto solar.',
    items: [
      {
        iconClass: 'fa-solid fa-chart-line',
        title: 'Calcula tu ahorro',
        description: 'Con nuestra calculadora de ahorro, puedes tomar la mejor decision para instalar paneles solares de PANSU.'
      },
      {
        iconClass: 'fa-solid fa-solar-panel',
        title: 'Instalacion: Como funciona?',
        description: 'Conoce todos los aspectos del proceso de instalacion de paneles solares junto a nuestros expertos y resuelve tus dudas.'
      },
      {
        iconClass: 'fa-solid fa-headset',
        title: 'Soporte al cliente 24/7',
        description: 'Nuestra empresa ofrece soporte gratuito 24/7 a todos nuestros clientes que tengan consultas o problemas con los productos y servicios de PANSU.'
      }
    ]
  };

  var state = null;
  var storage = window.PansurStorage || window.sessionStorage || window.localStorage;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.items) || raw.items.length < 3) return null;
    return {
      caption: String(raw.caption || '').trim().slice(0, CAPTION_MAX) || DEFAULTS.caption,
      items: raw.items.slice(0, 3).map(function (it, idx) {
        var fallback = DEFAULTS.items[idx];
        return {
          iconClass: String((it && it.iconClass) || '').trim().slice(0, ICON_MAX) || fallback.iconClass,
          title: String((it && it.title) || '').trim().slice(0, TITLE_MAX) || fallback.title,
          description: String((it && it.description) || '').trim().slice(0, DESC_MAX) || fallback.description
        };
      })
    };
  }

  function loadData() {
    try {
      var parsed = JSON.parse(storage.getItem(KEY) || 'null');
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
      '<div class="feature-item" data-why-index="' + idx + '">' +
        '<h3 class="h6 mb-3">Bloque ' + (idx + 1) + '</h3>' +
        '<div class="row g-3">' +
          '<div class="col-md-6">' +
            '<label class="form-label" for="why-icon-' + idx + '">Icono (clase Font Awesome)</label>' +
            '<input class="form-control why-icon" id="why-icon-' + idx + '" type="text" maxlength="' + ICON_MAX + '" value="' + escapeHtml(item.iconClass) + '">' +
          '</div>' +
          '<div class="col-md-6">' +
            '<label class="form-label" for="why-title-' + idx + '">Titulo</label>' +
            '<input class="form-control why-title" id="why-title-' + idx + '" type="text" maxlength="' + TITLE_MAX + '" value="' + escapeHtml(item.title) + '">' +
          '</div>' +
          '<div class="col-12">' +
            '<label class="form-label" for="why-description-' + idx + '">Descripcion</label>' +
            '<textarea class="form-control why-description" id="why-description-' + idx + '" rows="3" maxlength="' + DESC_MAX + '">' + escapeHtml(item.description) + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    var wrap = byId('why-items');
    wrap.innerHTML = state.items.map(function (item, idx) {
      return itemTemplate(item, idx);
    }).join('');

    wrap.querySelectorAll('[data-why-index]').forEach(function (row) {
      var idx = Number(row.getAttribute('data-why-index'));
      var iconInput = row.querySelector('.why-icon');
      var titleInput = row.querySelector('.why-title');
      var descInput = row.querySelector('.why-description');
      iconInput.addEventListener('input', function () {
        state.items[idx].iconClass = iconInput.value.slice(0, ICON_MAX);
        iconInput.value = state.items[idx].iconClass;
      });
      titleInput.addEventListener('input', function () {
        state.items[idx].title = titleInput.value.slice(0, TITLE_MAX);
        titleInput.value = state.items[idx].title;
      });
      descInput.addEventListener('input', function () {
        state.items[idx].description = descInput.value.slice(0, DESC_MAX);
        descInput.value = state.items[idx].description;
      });
    });
  }

  async function init() {
    var form = byId('why-cms-form');
    var captionInput = byId('why-caption');
    var resetBtn = byId('reset-btn');
    if (!form || !captionInput || !resetBtn) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    state = loadData();
    captionInput.value = state.caption;
    render();

    captionInput.addEventListener('input', function () {
      state.caption = captionInput.value.slice(0, CAPTION_MAX);
      captionInput.value = state.caption;
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var payload = {
        caption: String(state.caption || '').trim().slice(0, CAPTION_MAX),
        items: state.items.map(function (item, idx) {
          var fallback = DEFAULTS.items[idx];
          return {
            iconClass: String(item.iconClass || '').trim().slice(0, ICON_MAX) || fallback.iconClass,
            title: String(item.title || '').trim().slice(0, TITLE_MAX) || fallback.title,
            description: String(item.description || '').trim().slice(0, DESC_MAX) || fallback.description
          };
        })
      };
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.saveSection(SECTION, payload);
        } else {
          storage.setItem(KEY, JSON.stringify(payload));
        }
        setStatus('Seccion Por que PANSU actualizada correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar la seccion Por que PANSU.', false);
      }
    });

    resetBtn.addEventListener('click', async function () {
      try {
        if (window.PansurCMS) {
          await window.PansurCMS.resetSection(SECTION);
          await window.PansurCMS.syncFromServer();
          state = loadData();
        } else {
          storage.removeItem(KEY);
          state = clone(DEFAULTS);
        }
        captionInput.value = state.caption;
        render();
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar la seccion Por que PANSU.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
