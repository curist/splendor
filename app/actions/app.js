import B from 'app/broker';
import db from 'app/db';
import {initActors} from 'app/AI/actors';

B.on('app/data-inited', (action) => {
  const inGame = !!db.get('game');
  if(!inGame) {
    return;
  }
  const playerActors = db.get(['game', 'players']).map(player => {
    return player.actor;
  });
  initActors(playerActors);
});
