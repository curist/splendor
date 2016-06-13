var m = require('mithril');
var B = require('app/broker');
var db = require('app/db');

var syncLocalStorage = (function() {
  var key = 'mithril-app';

  function initStateFromLocalStorage() {
    var state = JSON.parse(localStorage.getItem(key) || "{}");
    db.set('state', state)
  }

  function syncLocalStorage() {
    var prevState = null;
    clearInterval(window.syncLocalStorageInterval);
    window.syncLocalStorageInterval = setInterval(function() {
      var state = db.get('state');
      if(state != prevState) {
        localStorage.setItem(key, JSON.stringify(state));
        prevState = state;
      }
    }, 2000);
  }

  return function setupAll() {
    initStateFromLocalStorage();
    syncLocalStorage();
  }
})();

function mountApplication() {
  require('app/style.css');
  require('app/actions');
  var Home = require('app/views/Home');
  m.mount(document.getElementById('app'), Home);
}

function init() {
  syncLocalStorage();
  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();
}

