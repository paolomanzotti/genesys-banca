var GENESYS_CONFIG = {
  environment: 'prod-euw1',
  deploymentId: 'efdfda93-c778-46ce-a580-45acf21d4a33'
};

var DEMO_CUSTOMER = { id: 'fcdd458a-624d-44fa-82cd-82f01b759e2f', firstName: 'Giulia', lastName: 'Rossi' };
var CUSTOMER_KEY = 'genesys-banca-customer';

(function loadMessenger() {
  if (!GENESYS_CONFIG.deploymentId) {
    window.Genesys = function () {};
    console.warn('Genesys Banca: deploymentId non impostato, Messenger disattivato.');
    return;
  }
  (function (g, e, n, es, ys) {
    g['_genesysJs'] = e;
    g[e] = g[e] || function () { (g[e].q = g[e].q || []).push(arguments) };
    g[e].t = 1 * new Date();
    g[e].c = es;
    ys = document.createElement('script'); ys.async = 1; ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
  })(window, 'Genesys', 'https://apps.mypurecloud.ie/genesys-bootstrap/genesys.min.js', GENESYS_CONFIG);
})();

var chatAttributes = {};
var messengerReady = false;

function pushAttributes() {
  if (!messengerReady) return;
  if (Object.keys(chatAttributes).length) {
    Genesys('command', 'Database.set', { messaging: { customAttributes: chatAttributes } });
  } else {
    Genesys('command', 'Database.removeAll');
  }
}

function setChatAttributes(values) {
  Object.keys(values).forEach(function (key) {
    if (values[key] === null || values[key] === undefined) delete chatAttributes[key];
    else chatAttributes[key] = String(values[key]);
  });
  pushAttributes();
}

Genesys('subscribe', 'Database.ready', function () {
  messengerReady = true;
  pushAttributes();
});

function recordJourneyEvent(eventName, attributes) {
  Genesys('command', 'Journey.record', { eventName: eventName, customAttributes: attributes });
}

function openChat() {
  Genesys('command', 'Messenger.open', {});
}

function renderAccount(customer) {
  document.querySelectorAll('[data-logged-out]').forEach(function (el) { el.hidden = !!customer; });
  document.querySelectorAll('[data-logged-in]').forEach(function (el) { el.hidden = !customer; });
  document.querySelectorAll('[data-customer-first-name]').forEach(function (el) {
    el.textContent = customer ? customer.firstName : '';
  });
}

function applyCustomer(customer) {
  renderAccount(customer);
  setChatAttributes({
    Customer_ID: customer ? customer.id || null : null,
    Customer_Name: customer ? customer.firstName + ' ' + customer.lastName : null
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var modal = document.querySelector('[data-login-modal]');
  applyCustomer(JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null'));

  document.querySelectorAll('[data-open-login]').forEach(function (button) {
    button.addEventListener('click', function () { modal.hidden = false; });
  });
  document.querySelector('[data-close-login]').addEventListener('click', function () { modal.hidden = true; });
  modal.addEventListener('click', function (event) { if (event.target === modal) modal.hidden = true; });
  document.querySelector('[data-login]').addEventListener('click', function () {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(DEMO_CUSTOMER));
    applyCustomer(DEMO_CUSTOMER);
    modal.hidden = true;
  });
  document.querySelectorAll('[data-logout]').forEach(function (button) {
    button.addEventListener('click', function () {
      localStorage.removeItem(CUSTOMER_KEY);
      applyCustomer(null);
    });
  });
  document.querySelectorAll('[data-open-chat]').forEach(function (button) {
    button.addEventListener('click', openChat);
  });
});
