import m from 'mithril';
import db from 'app/db';

var utils = {};

// bind data to mithril controller
utils.BindData = function BindData(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(function(propName) {
    const path = bindings[propName];
    const v = db.get(path);
    controller.data[propName] = v;
  });

  let watcher = controller._w = db.watch(bindings);
  watcher.on('update', function(e) {
    const data = e.target.get();
    controller.data = data;
    m.redraw();
  });
}

utils.syncLocalStorage = (function syncLocalStorage () {
  const key = 'mithril-app';

  function initStateFromLocalStorage() {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    db.set('state', state)
  }

  function syncToLocalStorage() {
    let prevState = null;
    clearInterval(window.syncLocalStorageInterval);
    window.syncLocalStorageInterval = setInterval(function() {
      const state = db.get('state');
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
