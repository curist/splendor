import B from 'app/broker';

B.removeAllListeners();

require('app/actions/firebase');

B.on('do', function(action) {
  B.emit(action.action, action);
});

