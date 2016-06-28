import B from 'app/broker';

B.removeAllListeners();

require('app/actions/game');
require('app/actions/gameaction');

B.on('do', function(action) {
  B.emit(action.action, action);
});

