import B from 'app/broker';
import db from 'app/db';

import firebase from 'app/firebase';

B.on('firebase/inc-count', function() {
  firebase.incCount();
});

B.on('firebase/count-updated', function(action) {
  db.set('count', action.count);
});

