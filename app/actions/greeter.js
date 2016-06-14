import B from 'app/broker';
import db from 'app/db';

B.on('change-name', function(action) {
  db.set(['state', 'user'], action.name);
})
