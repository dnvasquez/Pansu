(function () {
  'use strict';

  var KEY = 'pansur_faq_cms_v1';
  var QUESTION_MAX = 120;
  var ANSWER_MAX = 320;
  var DEFAULTS = {
    items: [
      {
        question: '¿Cuanto puedo ahorrar con paneles solares?',
        answer: 'El ahorro depende de tu consumo, ubicacion y porcentaje de cobertura solar. Puedes usar la calculadora del sitio para obtener una referencia inicial.'
      },
      {
        question: '¿Cuanto tarda la instalacion?',
        answer: 'En proyectos residenciales suele completarse en pocos dias luego de la visita tecnica y validacion del sistema recomendado.'
      },
      {
        question: '¿Que incluye el servicio de PANSU?',
        answer: 'Incluye asesoria, propuesta tecnica, instalacion, puesta en marcha y acompañamiento postventa segun el tipo de proyecto.'
      }
    ]
  };

  var state = null;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
    var items = raw.items.map(function (item) {
      return {
        question: String((item && item.question) || '').trim().slice(0, QUESTION_MAX),
        answer: String((item && item.answer) || '').trim().slice(0, ANSWER_MAX)
      };
    }).filter(function (item) { return item.question || item.answer; });
    return { items: items.length ? items : clone(DEFAULTS.items) };
  }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      var valid = normalize(parsed);
      if (valid) return valid;
    } catch (err) {}
    return clone(DEFAULTS);
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
      '<div class="faq-item" data-faq-index="' + idx + '">' +
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
          '<h3 class="h6 m-0">Pregunta ' + (idx + 1) + '</h3>' +
          '<button class="btn btn-outline-danger btn-sm remove-faq" type="button">Eliminar</button>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label" for="faq-question-' + idx + '">Pregunta</label>' +
          '<input class="form-control faq-question" id="faq-question-' + idx + '" type="text" maxlength="' + QUESTION_MAX + '" data-charcount-ignore="true" value="' + escapeHtml(item.question) + '">' +
          '<div class="char-count"><span class="faq-question-count">' + item.question.length + '</span> / ' + QUESTION_MAX + '</div>' +
        '</div>' +
        '<div>' +
          '<label class="form-label" for="faq-answer-' + idx + '">Respuesta</label>' +
          '<textarea class="form-control faq-answer" id="faq-answer-' + idx + '" rows="4" maxlength="' + ANSWER_MAX + '" data-charcount-ignore="true">' + escapeHtml(item.answer) + '</textarea>' +
          '<div class="char-count"><span class="faq-answer-count">' + item.answer.length + '</span> / ' + ANSWER_MAX + '</div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    var list = byId('faq-list');
    list.innerHTML = state.items.map(function (item, idx) { return itemTemplate(item, idx); }).join('');

    list.querySelectorAll('.faq-item').forEach(function (row) {
      var idx = Number(row.getAttribute('data-faq-index'));
      var q = row.querySelector('.faq-question');
      var a = row.querySelector('.faq-answer');
      var qCount = row.querySelector('.faq-question-count');
      var aCount = row.querySelector('.faq-answer-count');
      var removeBtn = row.querySelector('.remove-faq');

      q.addEventListener('input', function () {
        state.items[idx].question = q.value.slice(0, QUESTION_MAX);
        q.value = state.items[idx].question;
        qCount.textContent = String(state.items[idx].question.length);
      });
      a.addEventListener('input', function () {
        state.items[idx].answer = a.value.slice(0, ANSWER_MAX);
        a.value = state.items[idx].answer;
        aCount.textContent = String(state.items[idx].answer.length);
      });
      removeBtn.addEventListener('click', function () {
        if (state.items.length <= 1) {
          setStatus('Debe existir al menos una pregunta frecuente.', false);
          return;
        }
        state.items.splice(idx, 1);
        render();
      });
    });
  }

  function validate() {
    if (!state.items.length) {
      setStatus('Debe existir al menos una pregunta frecuente.', false);
      return false;
    }
    for (var i = 0; i < state.items.length; i += 1) {
      var item = state.items[i];
      item.question = String(item.question || '').trim();
      item.answer = String(item.answer || '').trim();
      if (!item.question || !item.answer) {
        setStatus('Todas las preguntas y respuestas deben tener contenido.', false);
        return false;
      }
      if (item.question.length > QUESTION_MAX || item.answer.length > ANSWER_MAX) {
        setStatus('Se excedio el limite de caracteres permitido.', false);
        return false;
      }
    }
    return true;
  }

  function init() {
    var form = byId('faq-cms-form');
    var resetBtn = byId('reset-btn');
    var addBtn = byId('add-faq-btn');
    if (!form || !resetBtn || !addBtn) return;

    state = loadData();
    render();

    addBtn.addEventListener('click', function () {
      state.items.push({ question: '', answer: '' });
      render();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      localStorage.setItem(KEY, JSON.stringify({ items: state.items }));
      setStatus('Preguntas frecuentes guardadas correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      state = clone(DEFAULTS);
      render();
      setStatus('Se restauraron los valores por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
