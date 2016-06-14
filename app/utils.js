var m = require('mithril');
var db = require('app/db');

var utils = {};

// bind data to mithril controller
utils.BindData = function(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(function(propName) {
    var path = bindings[propName];
    var v = db.get(path);
    controller.data[propName] = v;
  });

  var watcher = controller._w = db.watch(bindings);
  watcher.on('update', function(e) {
    var data = e.target.get();
    controller.data = data;
    m.redraw();
  });
}

utils.syncLocalStorage = (function syncLocalStorage () {
  var key = 'mithril-app';

  function initStateFromLocalStorage() {
    var state = JSON.parse(localStorage.getItem(key) || "{}");
    db.set('state', state)
  }

  function syncToLocalStorage() {
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
    syncToLocalStorage();
  }
})();

module.exports = utils;
