import B from 'app/broker';
import db from 'app/db';

import firebase from 'app/firebase';

B.on('signin', () => {
  firebase.signIn();
})

B.on('signout', () => {
  firebase.signOut();
})

B.on('firebase/signin', (action) => {
  var user = {
    uid: action.user.uid,
    name: action.user.displayName,
    email: action.user.email,
    photoUrl: action.user.photoURL,
  }
  db.set('user', user);
})

B.on('firebase/signout', () => {
  db.unset('user');
})
