(function () {
  'use strict';

  var SECTION = 'about';
  var KEY = 'pansur_about_cms_v1';
  var TITLE_MAX = 70;
  var SUBTITLE_MAX = 110;
  var DESCRIPTION_MAX = 520;
  var IMAGE_URL_MAX = 500;
  var ABOUT_IMAGE_MAX_BYTES = 1.2 * 1024 * 1024; // 1.2 MB
  var DEFAULTS = {
    title: 'Quienes somos',
    subtitle: 'Equipo de especialistas en energia alternativa',
    description: 'Nuestra empresa ofrece un servicio integral y orientado al cliente en energia alternativa, centrado en la comercializacion, distribucion y transporte de paneles solares. Somos una empresa de energia renovable amigable con el medioambiente que ofrece un amplio portafolio de tecnologias, productos y soluciones para nuestros clientes.',
    images: [
      'images/about-01-639x480.jpg',
      'images/about-02-639x480.jpg',
      'images/about-03-639x480.jpg'
    ]
  };

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (parsed && Array.isArray(parsed.images) && parsed.images.length >= 3) return parsed;
    } catch (err) {}
    return clone(DEFAULTS);
  }

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

  function fill(data) {
    byId('about-title').value = data.title || '';
    byId('about-subtitle').value = data.subtitle || '';
    byId('about-description').value = data.description || '';
    for (var i = 0; i < 3; i += 1) {
      byId('about-image-' + i).value = data.images[i] || '';
      byId('about-preview-' + i).src = data.images[i] || '';
    }
  }

  function bindImageInputs() {
    for (var i = 0; i < 3; i += 1) {
      (function (idx) {
      var urlInput = byId('about-image-' + idx);
        var fileInput = byId('about-file-' + idx);
        var preview = byId('about-preview-' + idx);

        urlInput.addEventListener('input', function () {
          urlInput.value = String(urlInput.value || '').slice(0, IMAGE_URL_MAX);
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
          if (file.size > ABOUT_IMAGE_MAX_BYTES) {
            setStatus('La imagen de Quienes somos supera el limite de ' + prettySize(ABOUT_IMAGE_MAX_BYTES) + '.', false);
            fileInput.value = '';
            return;
          }
          var reader = new FileReader();
          reader.onload = function (e) {
            var src = String(e.target.result || '');
            urlInput.value = src.slice(0, IMAGE_URL_MAX);
            preview.src = src;
          };
          reader.readAsDataURL(file);
        });
      })(i);
    }
  }

  function collect() {
    var data = {
      title: (byId('about-title').value || '').trim().slice(0, TITLE_MAX),
      subtitle: (byId('about-subtitle').value || '').trim().slice(0, SUBTITLE_MAX),
      description: (byId('about-description').value || '').trim().slice(0, DESCRIPTION_MAX),
      images: [
        (byId('about-image-0').value || '').trim().slice(0, IMAGE_URL_MAX),
        (byId('about-image-1').value || '').trim().slice(0, IMAGE_URL_MAX),
        (byId('about-image-2').value || '').trim().slice(0, IMAGE_URL_MAX)
      ]
    };

    if (!data.title || !data.subtitle || !data.description || data.images.some(function (x) { return !x; })) {
      setStatus('Completa todos los campos antes de guardar.', false);
      return null;
    }
    return data;
  }

  async function init() {
    var form = byId('about-cms-form');
    var resetBtn = byId('reset-btn');
    if (!form || !resetBtn) return;

    if (window.PansurCMS) {
      await window.PansurCMS.requireAuth();
      await window.PansurCMS.syncFromServer();
    }

    fill(loadData());
    bindImageInputs();

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
        setStatus('Seccion Quienes Somos actualizada correctamente.', true);
      } catch (err) {
        setStatus('No se pudo guardar la seccion Quienes Somos.', false);
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
        fill(clone(DEFAULTS));
        if (window.PansurCMS) fill(loadData());
        setStatus('Se restauraron los valores por defecto.', true);
      } catch (err) {
        setStatus('No se pudo restaurar la seccion Quienes Somos.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
