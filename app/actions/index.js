import B from 'app/broker';

B.removeAllListeners();

require('app/actions/firebase');
require('app/actions/firebase-counter');

B.on('do', function(action) {
  B.emit(action.action, action);
});

