import B from 'app/broker';
import db from 'app/db';

const config = {
  apiKey: "AIzaSyBoT3dxnQHbp3F2tVVKlzNI5sFGLEOKAHQ",
  authDomain: "project-5049152049997853939.firebaseapp.com",
  databaseURL: "https://project-5049152049997853939.firebaseio.com",
  storageBucket: "project-5049152049997853939.appspot.com",
};

class FirebaseApp {
  constructor() {
    firebase.initializeApp(config);

    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged);

    this.database.ref('counter').on('value', this.onCountChanged);
  }

  onAuthStateChanged (user) {
    if(user) {
      B.do({
        action: 'firebase/signin',
        user: user
      });
    } else {
      B.do({
        action: 'firebase/signout'
      })
    }
  }

  onCountChanged (countSnapshot) {
    const count = countSnapshot.val();
    db.set('count', count);
  }

  signIn () {
    const provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
  }

  signOut () {
    this.auth.signOut();
  }

  incCount() {
    const count = db.get('count');
    this.database.ref('counter').set(count + 1);
  }

}

export default new FirebaseApp();
