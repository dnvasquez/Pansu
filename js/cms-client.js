(function () {
  'use strict';

  var sectionToKey = {
    header: 'pansur_header_cms_v1',
    why: 'pansur_why_cms_v1',
    kpis: 'pansur_kpis_cms_v1',
    about: 'pansur_about_cms_v1',
    contact: 'pansur_contact_cms_v1',
    social: 'pansur_social_cms_v1',
    visibility: 'pansur_visibility_cms_v1',
    faq: 'pansur_faq_cms_v1',
    quote: 'pansur_quote_cms_v1',
    products: 'pansur_products_cms_v2',
    savings: 'pansur_savings_cms_v1'
  };
  var storage = window.PansurStorage || window.sessionStorage || window.localStorage;

  function redirectToLogin() {
    var next = encodeURIComponent(window.location.pathname || '/admin-header.html');
    window.location.href = '/login.html?next=' + next;
  }

  async function request(url, options) {
    var response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    }, options || {}));

    var data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      var error = new Error((data && data.message) || 'Request failed');
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  function syncLocalStorage(content) {
    Object.keys(sectionToKey).forEach(function (section) {
      if (!content || typeof content[section] === 'undefined') return;
      storage.setItem(sectionToKey[section], JSON.stringify(content[section]));
    });
  }

  async function syncFromServer() {
    var data = await request('/api/content', { method: 'GET', headers: {} });
    if (data && data.content) syncLocalStorage(data.content);
    return data && data.content ? data.content : null;
  }

  async function saveSection(section, payload) {
    var data = await request('/api/content', {
      method: 'POST',
      body: JSON.stringify({ section: section, data: payload })
    });
    if (data && data.data && sectionToKey[section]) {
      storage.setItem(sectionToKey[section], JSON.stringify(data.data));
    }
    return data;
  }

  async function resetSection(section) {
    var data = await request('/api/content', {
      method: 'POST',
      body: JSON.stringify({ section: section, reset: true })
    });
    if (data && data.data && sectionToKey[section]) {
      storage.setItem(sectionToKey[section], JSON.stringify(data.data));
    }
    return data;
  }

  async function getSession() {
    return request('/api/session', { method: 'GET', headers: {} });
  }

  async function requireAuth() {
    var session = await getSession();
    if (!session || !session.authenticated) {
      redirectToLogin();
      return false;
    }
    return true;
  }

  async function logout() {
    await request('/api/logout', { method: 'POST' });
    redirectToLogin();
  }

  window.PansurCMS = {
    sectionToKey: sectionToKey,
    syncFromServer: syncFromServer,
    saveSection: saveSection,
    resetSection: resetSection,
    getSession: getSession,
    requireAuth: requireAuth,
    logout: logout
  };
})();
