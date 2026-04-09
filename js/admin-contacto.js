(function () {
  'use strict';

  var KEY = 'pansur_contact_cms_v1';
  var CONTACT_TITLE_MAX = 70;
  var NAV_PHONE_MAX = 24;
  var FORM_TITLE_MAX = 150;
  var OFFICE_NAME_MAX = 90;
  var OFFICE_ADDRESS_MAX = 140;
  var OFFICE_PHONE_MAX = 24;
  var OFFICE_FAX_MAX = 24;
  var DEFAULTS = {
    contactTitle: 'Contactanos',
    navPhone: '555-376-7872',
    formTitle: 'Solicita una cotizacion para una instalacion de paneles solares residencial o comercial',
    offices: [
      {
        name: 'Oficina central (Boston, MA, EE. UU.)',
        address1: '8949 Kenamar Drive, Suite 101',
        address2: 'Boston, MA 92121',
        phone: '555-376-7872',
        fax: '555-376-7873'
      },
      {
        name: 'Oficina de Toronto',
        address1: '2000 Finch Avenue West',
        address2: 'Toronto, Ontario M3J 2V5',
        phone: '555-376-7872',
        fax: '555-376-7873'
      }
    ]
  };

  var state = null;

  function byId(id) { return document.getElementById(id); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function normalizeOffice(raw) {
    raw = raw || {};
    return {
      name: String(raw.name || '').trim().slice(0, OFFICE_NAME_MAX),
      address1: String(raw.address1 || '').trim().slice(0, OFFICE_ADDRESS_MAX),
      address2: String(raw.address2 || '').trim().slice(0, OFFICE_ADDRESS_MAX),
      phone: String(raw.phone || '').trim().slice(0, OFFICE_PHONE_MAX),
      fax: String(raw.fax || '').trim().slice(0, OFFICE_FAX_MAX)
    };
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var offices = [];
    if (Array.isArray(raw.offices)) {
      offices = raw.offices.map(normalizeOffice);
    } else if (raw.office1 || raw.office2) {
      offices = [normalizeOffice(raw.office1), normalizeOffice(raw.office2)];
    }
    return {
      contactTitle: String(raw.contactTitle || '').trim().slice(0, CONTACT_TITLE_MAX),
      navPhone: String(raw.navPhone || '').trim().slice(0, NAV_PHONE_MAX),
      formTitle: String(raw.formTitle || '').trim().slice(0, FORM_TITLE_MAX),
      offices: offices
    };
  }

  function loadData() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      var normalized = normalize(parsed);
      if (normalized) return normalized;
    } catch (err) {}
    return clone(DEFAULTS);
  }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function officeTemplate(office, index) {
    return '' +
      '<div class="office-item" data-office-index="' + index + '">' +
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
          '<h3 class="h6 m-0">Oficina ' + (index + 1) + '</h3>' +
          '<button class="btn btn-outline-danger btn-sm remove-office" type="button">Eliminar oficina</button>' +
        '</div>' +
        '<div class="row g-3">' +
          '<div class="col-md-6"><label class="form-label">Nombre</label><input class="form-control office-name" type="text" maxlength="' + OFFICE_NAME_MAX + '" value="' + escapeHtml(office.name) + '"></div>' +
          '<div class="col-md-6"><label class="form-label">Telefono</label><input class="form-control office-phone" type="text" maxlength="' + OFFICE_PHONE_MAX + '" value="' + escapeHtml(office.phone) + '"></div>' +
          '<div class="col-md-6"><label class="form-label">Direccion linea 1</label><input class="form-control office-address1" type="text" maxlength="' + OFFICE_ADDRESS_MAX + '" value="' + escapeHtml(office.address1) + '"></div>' +
          '<div class="col-md-6"><label class="form-label">Direccion linea 2</label><input class="form-control office-address2" type="text" maxlength="' + OFFICE_ADDRESS_MAX + '" value="' + escapeHtml(office.address2) + '"></div>' +
          '<div class="col-md-6"><label class="form-label">Fax</label><input class="form-control office-fax" type="text" maxlength="' + OFFICE_FAX_MAX + '" value="' + escapeHtml(office.fax) + '"></div>' +
        '</div>' +
      '</div>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderOffices() {
    var list = byId('offices-list');
    if (!list) return;
    list.innerHTML = state.offices.map(function (office, idx) {
      return officeTemplate(office, idx);
    }).join('');

    list.querySelectorAll('.office-item').forEach(function (item) {
      var idx = Number(item.getAttribute('data-office-index'));
      var office = state.offices[idx];
      if (!office) return;

      item.querySelector('.office-name').addEventListener('input', function (e) { office.name = e.target.value.slice(0, OFFICE_NAME_MAX); e.target.value = office.name; });
      item.querySelector('.office-phone').addEventListener('input', function (e) { office.phone = e.target.value.slice(0, OFFICE_PHONE_MAX); e.target.value = office.phone; });
      item.querySelector('.office-address1').addEventListener('input', function (e) { office.address1 = e.target.value.slice(0, OFFICE_ADDRESS_MAX); e.target.value = office.address1; });
      item.querySelector('.office-address2').addEventListener('input', function (e) { office.address2 = e.target.value.slice(0, OFFICE_ADDRESS_MAX); e.target.value = office.address2; });
      item.querySelector('.office-fax').addEventListener('input', function (e) { office.fax = e.target.value.slice(0, OFFICE_FAX_MAX); e.target.value = office.fax; });
      item.querySelector('.remove-office').addEventListener('click', function () {
        state.offices.splice(idx, 1);
        renderOffices();
      });
    });
  }

  function fill(data) {
    byId('contact-title').value = data.contactTitle || '';
    byId('nav-phone').value = data.navPhone || '';
    byId('form-title').value = data.formTitle || '';
    state.offices = Array.isArray(data.offices) ? data.offices.map(normalizeOffice) : [];
    renderOffices();
  }

  function collect() {
    return {
      contactTitle: String(byId('contact-title').value || '').trim().slice(0, CONTACT_TITLE_MAX),
      navPhone: String(byId('nav-phone').value || '').trim().slice(0, NAV_PHONE_MAX),
      formTitle: String(byId('form-title').value || '').trim().slice(0, FORM_TITLE_MAX),
      offices: state.offices.map(normalizeOffice)
    };
  }

  function init() {
    var form = byId('contact-cms-form');
    var resetBtn = byId('reset-btn');
    var addOfficeBtn = byId('add-office-btn');
    if (!form || !resetBtn || !addOfficeBtn) return;

    state = loadData();
    fill(state);

    addOfficeBtn.addEventListener('click', function () {
      state.offices.push({ name: '', address1: '', address2: '', phone: '', fax: '' });
      renderOffices();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      localStorage.setItem(KEY, JSON.stringify(collect()));
      setStatus('Informacion de contacto guardada correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      state = clone(DEFAULTS);
      fill(state);
      setStatus('Se restauraron los valores por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
