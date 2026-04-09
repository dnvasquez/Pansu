(function () {
  'use strict';

  var STYLE_ID = 'admin-charcount-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '' +
      '.char-count{' +
      'font-size:12px;color:#6a6a6a;text-align:right;margin-top:4px;line-height:1.2;' +
      '}' +
      '.char-count.limit-near{color:#9a6f00;}' +
      '.char-count.limit-max{color:#b02020;}';
    document.head.appendChild(style);
  }

  function isSupportedField(el) {
    if (!el || el.getAttribute('data-charcount-ignore') === 'true') return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    return type === 'text' || type === 'email' || type === 'url' || type === 'password';
  }

  function getMax(el) {
    var raw = Number(el.getAttribute('maxlength'));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  function ensureId(el) {
    if (!el.id) el.id = 'cc-' + Math.random().toString(36).slice(2, 10);
    return el.id;
  }

  function getCounter(el) {
    var id = ensureId(el);
    return el.parentElement && el.parentElement.querySelector('[data-char-count-for="' + id + '"]');
  }

  function updateCounter(el, counter) {
    var max = getMax(el);
    if (!max || !counter) return;
    var len = String(el.value || '').length;
    counter.textContent = len + ' / ' + max;
    counter.classList.remove('limit-near', 'limit-max');
    if (len >= max) counter.classList.add('limit-max');
    else if (len >= Math.floor(max * 0.9)) counter.classList.add('limit-near');
  }

  function bindField(el) {
    if (!isSupportedField(el)) return;
    var max = getMax(el);
    if (!max) return;
    if (el.dataset.charcountBound === '1') {
      var existing = getCounter(el);
      updateCounter(el, existing);
      return;
    }

    var id = ensureId(el);
    var counter = getCounter(el);
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'char-count';
      counter.setAttribute('data-char-count-for', id);
      el.insertAdjacentElement('afterend', counter);
    }

    el.addEventListener('input', function () { updateCounter(el, counter); });
    el.addEventListener('change', function () { updateCounter(el, counter); });
    el.dataset.charcountBound = '1';
    updateCounter(el, counter);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(bindField);
  }

  function initObserver() {
    var obs = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.matches && node.matches('input[maxlength], textarea[maxlength]')) bindField(node);
          scan(node);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function refreshAll() {
    scan(document);
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureStyle();
    scan(document);
    initObserver();

    // Muchos paneles cargan valores por JS en su propio DOMContentLoaded.
    // Refrescamos despues para que el contador refleje texto precargado.
    setTimeout(refreshAll, 0);
    setTimeout(refreshAll, 200);
  });

  window.addEventListener('pageshow', refreshAll);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshAll();
  });
})();
