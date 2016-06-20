import B from 'app/broker';

B.removeAllListeners();

require('app/actions/firebase');
require('app/actions/game');

B.on('do', function(action) {
  B.emit(action.action, action);
});

