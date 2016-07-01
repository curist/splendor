import db from 'app/db';
import B from 'app/broker';

export const syncLocalStorage = (function() {
  var key = 'mithril-splendor-app';

  function initStateFromLocalStorage() {
    var state = JSON.parse(localStorage.getItem(key) || '{}');
    db.set(state);
    B.do({ action: 'app/data-inited' });
  }

  function syncLocalStorage() {
    var prevState = null;
    clearInterval(window.syncLocalStorageInterval);
    window.syncLocalStorageInterval = setInterval(function() {
      var state = db.get();
      if(state != prevState) {
        localStorage.setItem(key, JSON.stringify(state));
        prevState = state;
      }
    }, 2000);
  }

  return function setupAll() {
    initStateFromLocalStorage();
    syncLocalStorage();
  };
})();

