import B from 'app/broker';
import db from 'app/db';

B.on('counter-inc', function(action) {
  function inc(n) {
    return n + 1;
  }
  db.apply('count', inc);
})

B.on('counter-add2', function(action) {
  const n = db.get('count');
  db.set('count', n + 2);
})

B.on('counter-reset', function(action) {
  db.set('count', 0);
})
