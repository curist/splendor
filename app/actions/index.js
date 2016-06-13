var B = require('app/broker');
var db = require('app/db');

B.removeAllListeners();

B.on('do', function(action) {
  B.emit(action.action, action);
});

B.on('inc', function(action) {
  function inc(n) {
    return n + 1;
  }
  db.apply('count', inc);
})

B.on('add2', function(action) {
  var n = db.get('count');
  db.set('count', n + 2);
})

B.on('reset-counter', function(action) {
  db.set('count', 0);
})
