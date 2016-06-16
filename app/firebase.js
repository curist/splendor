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
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

    this.database.ref('counter').on('value', this.onCountChanged.bind(this));
    this.database.ref('clickers').on('child_added', this.onClickerChanged.bind(this));
    this.database.ref('clickers').on('child_changed', this.onClickerRemoved.bind(this));
    this.database.ref('clickers').on('child_removed', this.onClickerRemoved.bind(this));
  }

  onAuthStateChanged (user) {
    if(user) {
      B.do({
        action: 'firebase/signin',
        user: user
      });
      this.database.ref('clickers/' + user.uid).set({
        uid: user.uid,
        username: user.displayName,
        photoUrl: user.photoURL || 'https://s3.amazonaws.com/wll-community-production/images/no-avatar.png',
      })
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

  onClickerChanged (clickerSnapshot) {
    var clicker = clickerSnapshot.val()
    db.push('clickers', clicker);
  }

  onClickerRemoved (snap) {
    const removedClicker = snap.val();
    db.apply('clickers', (clickers) => {
      return clickers.filter(clicker => {
        return clicker.uid !== removedClicker.uid;
      })
    });
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

  leaveGame() {
    const user = this.auth.currentUser;
    this.database.ref('clickers/' + user.uid).remove().catch(function(err) {
      console.log(err);
    })
  }

}

export default new FirebaseApp();
