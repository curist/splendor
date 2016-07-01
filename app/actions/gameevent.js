import B from 'app/broker';
import db from 'app/db';

import { validateAction } from 'app/utils';
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
  const playerIndex = db.get(['game', 'current-player']);
  const players = db.get(['game', 'players']);
  const player = players[playerIndex];
  const nobles = db.get(['game', 'nobles']);
  const resources = db.get(['game', 'resources']);
  const deckRemaingings = [
    db.get(['game', 'deck1']).length,
    db.get(['game', 'deck2']).length,
    db.get(['game', 'deck3']).length,
  ];
  return {
    cards, player, players, nobles,
    resources, deckRemaingings,
  };
}

B.on('gameevent/turn', action => {
  const resources = db.get(['game', 'resources']);
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);

  const actor = getActors()[playerIndex];
  if(!actor.isAI) {
    return;
  }
  const gameState = composeGameState(db);

  const turnAction = actor.turn(gameState);
  // turnAction can be [buy, hold, resource]
  debug(turnAction);
  let gameAction;
  switch(turnAction.action) {
  case 'buy':
    gameAction = {
      action: 'gameaction/acquire-card',
      card: turnAction.card,
    };
    break;
  case 'hold':
    gameAction = {
      action: 'gameaction/reserve-card',
      card: turnAction.card,
    };
    break;
  case 'resource':
    gameAction = {
      action: 'gameaction/take-resources',
      resources: turnAction.resources,
    };
    break;
  default:
    debug(`unknown turn action: ${turnAction.action}`);
    throw new Error(`Unknown turn action by ${player.actor}: ${turnAction.action}`);
  }

  validateAction(player, resources, gameAction);
  B.do(gameAction);
});

B.on('gameevent/drop-resource', action => {
  const resources = db.get(['game', 'resources']);
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(player.actor == 'human') {
    return;
  }
  const actor = getActors()[playerIndex];
  const gameState = composeGameState(db);

  const droppingResources = actor.dropResources(gameState, player.resources);
  let gameAction = {
    action: 'gameaction/drop-resources',
    resources: droppingResources ,
  };
  validateAction(player, resources, gameAction);
  B.do(gameAction);
});

B.on('gameevent/pick-noble', action => {
  const resources = db.get(['game', 'resources']);
  const { nobles } = action;
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(player.actor == 'human') {
    return;
  }
  const actor = getActors()[playerIndex];
  const gameState = composeGameState(db);

  const noble = actor.pickNoble(gameState, nobles);
  let gameAction = {
    action: 'gameaction/pick-noble',
    noble: noble,
  };
  validateAction(player, resources, gameAction);
  B.do(gameAction);

});
