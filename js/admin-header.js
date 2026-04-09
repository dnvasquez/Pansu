(function () {
  'use strict';

  var KEY = 'pansur_header_cms_v1';
  var BUTTON_LINK_OPTIONS = ['#home', '#about', '#products', '#contacts'];
  var HERO_PRIMARY_MAX = 36;
  var HERO_SECONDARY_MAX = 90;
  var HERO_DESCRIPTION_MAX = 260;
  var HERO_BUTTON_TEXT_MAX = 36;
  var SLIDE_URL_MAX = 500;
  var SLIDE_IMAGE_MAX_BYTES = 1.8 * 1024 * 1024; // 1.8 MB
  var DEFAULTS = {
    heroPrimary: 'PAN',
    heroSecondary: 'SUR Paneles Solares',
    heroDescription: 'Los paneles solares son perfectos si buscas una fuente confiable de energia adicional para tu hogar u oficina.',
    heroButtonText: 'Mas informacion',
    heroButtonLink: '#about',
    slides: [
      'images/slide-03.jpg',
      'images/slide-02.jpg',
      'images/slide-01.jpg'
    ]
  };

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function prettySize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var slides = Array.isArray(raw.slides) ? raw.slides.map(function (x) { return String(x || '').trim(); }) : [];
    if (slides.length < 3 || slides.some(function (x) { return !x; })) return null;
    return {
      heroPrimary: String(raw.heroPrimary || '').trim().slice(0, HERO_PRIMARY_MAX) || DEFAULTS.heroPrimary,
      heroSecondary: String(raw.heroSecondary || '').trim().slice(0, HERO_SECONDARY_MAX) || DEFAULTS.heroSecondary,
      heroDescription: String(raw.heroDescription || '').trim().slice(0, HERO_DESCRIPTION_MAX) || DEFAULTS.heroDescription,
      heroButtonText: String(raw.heroButtonText || '').trim().slice(0, HERO_BUTTON_TEXT_MAX) || DEFAULTS.heroButtonText,
      heroButtonLink: BUTTON_LINK_OPTIONS.indexOf(String(raw.heroButtonLink || '').trim()) !== -1
        ? String(raw.heroButtonLink || '').trim()
        : DEFAULTS.heroButtonLink,
      slides: slides.slice(0, 3)
    };
  }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      var data = normalize(parsed);
      if (data) return data;
    } catch (err) {}
    return clone(DEFAULTS);
  }

  function fill(data) {
    byId('hero-primary').value = data.heroPrimary || '';
    byId('hero-secondary').value = data.heroSecondary || '';
    byId('hero-description').value = data.heroDescription || '';
    byId('hero-button-text').value = data.heroButtonText || '';
    byId('hero-button-link').value = BUTTON_LINK_OPTIONS.indexOf(data.heroButtonLink) !== -1
      ? data.heroButtonLink
      : DEFAULTS.heroButtonLink;

    for (var i = 0; i < 3; i += 1) {
      byId('slide-image-' + i).value = data.slides[i] || '';
      byId('slide-preview-' + i).src = data.slides[i] || '';
    }
  }

  function bindImageInputs() {
    for (var i = 0; i < 3; i += 1) {
      (function (idx) {
      var urlInput = byId('slide-image-' + idx);
        var fileInput = byId('slide-file-' + idx);
        var preview = byId('slide-preview-' + idx);

        urlInput.addEventListener('input', function () {
          urlInput.value = String(urlInput.value || '').slice(0, SLIDE_URL_MAX);
          preview.src = urlInput.value.trim();
        });

        fileInput.addEventListener('change', function () {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            setStatus('El archivo seleccionado no es una imagen valida.', false);
            fileInput.value = '';
            return;
          }
          if (file.size > SLIDE_IMAGE_MAX_BYTES) {
            setStatus('La imagen del encabezado supera el limite de ' + prettySize(SLIDE_IMAGE_MAX_BYTES) + '.', false);
            fileInput.value = '';
            return;
          }
          var reader = new FileReader();
          reader.onload = function (e) {
            var src = String(e.target.result || '');
            urlInput.value = src.slice(0, SLIDE_URL_MAX);
            preview.src = src;
          };
          reader.readAsDataURL(file);
        });
      })(i);
    }
  }

  function collect() {
    var data = {
      heroPrimary: String(byId('hero-primary').value || '').trim().slice(0, HERO_PRIMARY_MAX),
      heroSecondary: String(byId('hero-secondary').value || '').trim().slice(0, HERO_SECONDARY_MAX),
      heroDescription: String(byId('hero-description').value || '').trim().slice(0, HERO_DESCRIPTION_MAX),
      heroButtonText: String(byId('hero-button-text').value || '').trim().slice(0, HERO_BUTTON_TEXT_MAX),
      heroButtonLink: String(byId('hero-button-link').value || '').trim(),
      slides: [
        String(byId('slide-image-0').value || '').trim().slice(0, SLIDE_URL_MAX),
        String(byId('slide-image-1').value || '').trim().slice(0, SLIDE_URL_MAX),
        String(byId('slide-image-2').value || '').trim().slice(0, SLIDE_URL_MAX)
      ]
    };

    if (!data.heroPrimary || !data.heroSecondary || !data.heroDescription || !data.heroButtonText || !data.heroButtonLink ||
        data.slides.some(function (x) { return !x; })) {
      setStatus('Completa todos los campos antes de guardar.', false);
      return null;
    }
    if (BUTTON_LINK_OPTIONS.indexOf(data.heroButtonLink) === -1) {
      setStatus('Selecciona una accion valida para el boton.', false);
      return null;
    }
    return data;
  }

  function init() {
    var form = byId('header-cms-form');
    var resetBtn = byId('reset-btn');
    if (!form || !resetBtn) return;

    fill(loadData());
    bindImageInputs();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = collect();
      if (!data) return;
      localStorage.setItem(KEY, JSON.stringify(data));
      setStatus('Header actualizado correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      fill(clone(DEFAULTS));
      setStatus('Se restauraron los valores por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
