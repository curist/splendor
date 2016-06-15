import B from 'app/broker';
import db from 'app/db';

import firebase from 'app/firebase';

B.on('signin', function() {
  firebase.signIn();
})

B.on('signout', function() {
  firebase.signOut();
})

B.on('firebase/signin', function(action) {
  var user = {
    name: action.user.displayName,
    photoUrl: action.user.photoURL,
  }
  db.set('user', user);
})

B.on('firebase/signout', function(action) {
  db.unset('user');
})
