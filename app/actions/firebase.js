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
    uid: action.user.uid,
    name: action.user.displayName,
    email: action.user.email,
    photoUrl: action.user.photoURL,
  }
  db.set('user', user);
})

B.on('firebase/signout', function(action) {
  db.unset('user');
})
