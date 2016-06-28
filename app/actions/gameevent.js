import B from 'app/broker';
import db from 'app/db';

import {getActors} from 'app/AI/actors';

import {colors} from 'app/data/game-setting';

const debug = require('debug')('app/actions/gameevent');

function composeGameState(db) {
  const cards = db.get(['game', 'cards1']).concat(
    db.get(['game', 'cards2'])
  ).concat(
    db.get(['game', 'cards3'])
  ).filter(card => {
    return card.status !== 'empty';
  });
  const deckRemaingings = [
    db.get(['game', 'deck1']).length,
    db.get(['game', 'deck2']).length,
    db.get(['game', 'deck3']).length,
  ];
  return {
    winGameScore: db.get(['game', 'win-game-score']),
    cards: cards,
    players: db.get(['game', 'players']),
    nobles: db.get(['game', 'nobles']),
    resources: db.get(['game', 'resource']),
    deckRemaingings: deckRemaingings,
  };
}

B.on('gameevent/turn', action => {
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(player.actor == 'human') {
    return;
  }
  const actor = getActors()[playerIndex];
  const gameState = composeGameState(db);

  const turnAction = actor.turn(gameState, playerIndex);
  // turnAction can be [buy, hold, resource]
  debug(turnAction);
  if(turnAction.action == 'buy') {
    B.do({
      action: 'gameaction/acquire-card',
      card: turnAction.card,
    });
  } else if(turnAction.action == 'hold') {
    B.do({
      action: 'gameaction/reserve-card',
      card: turnAction.card,
    });
  } else if(turnAction.action == 'resource') {
    B.do({
      action: 'gameaction/take-resources',
      resources: turnAction.resources,
    });
  } else {
    debug(`unknown turn action: ${turnAction.action}`);
  }
});

B.on('gameevent/drop-resource', action => {
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(player.actor == 'human') {
    return;
  }
  const actor = getActors()[playerIndex];
  const gameState = composeGameState(db);

  const resources = actor.dropResources(gameState, playerIndex, player.resources);
  B.do({
    action: 'gameaction/drop-resources',
    resources: resources,
  });
});

B.on('gameevent/pick-noble', action => {
  const { nobles } = action;
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(player.actor == 'human') {
    return;
  }
  const actor = getActors()[playerIndex];
  const gameState = composeGameState(db);

  const noble = actor.pickNoble(gameState, playerIndex, nobles);
  B.do({
    action: 'gameaction/pick-noble',
    noble: noble,
  });

});
