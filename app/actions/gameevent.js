import _ from 'underscore';
import B from 'app/broker';
import db from 'app/db';

import { validateAction } from 'app/validates';
import {getActors} from 'app/AI/actors';
import {colors} from 'app/data/game-setting';
import {composeGameState} from './helpers';

const debug = require('debug')('app/actions/gameevent');

const AIActionDelay = 600 /* ms */;

let timeouts = [];

function delay(time, fn) {
  return new Promise(resolve => {
    timeouts.push(setTimeout(() => {
      const result = fn();
      resolve(result);
    }, time));
  });
}

function delayChain(time, fns) {
  return fns.reduce((promiseChain, fn) => {
    if(!promiseChain) {
      return delay(0, fn);
    }
    return promiseChain.then(()=>{
      return delay(time, fn);
    });
  }, undefined);
}

function flattenResources (resources) {
  return Object.keys(resources).reduce((flattenResources, key) => {
    return flattenResources.concat(
      _.times(resources[key], () => { return key; })
    );
  }, []);
}

function zipResources (resources) {
  return resources.reduce((obj, res) => {
    obj[res] = obj[res] || 0;
    obj[res] += 1;
    return obj;
  }, {});
}

function playAITurnAction(action) {
  const { action: actionType, card } = action;

  if(actionType == 'gameaction/take-resources') {
    // an array of array
    // presenting resources we are taking on each steps
    const stepRes = flattenResources(action.resources).reduce((stepRes, color) => {
      const len = stepRes.length;
      const prevStep = (len > 0) ? stepRes[len - 1] : [];
      const step = prevStep.concat([color]);
      return stepRes.concat([step]);
    }, []);
    const stepFns = stepRes.map(stepres => {
      const res = zipResources(stepres);
      return () => {
        B.do({
          action: 'gameaction/take-resource',
          resources: res,
        });
      };
    });

    delayChain(150, stepFns).then(() => {
      delay(AIActionDelay, () => {
        B.do({
          action: 'gameaction/take-resources',
          resources: action.resources,
        });
      });
    });

  } else {
    // 'gameaction/acquire-card',
    // 'gameaction/reserve-card',

    // delay 0ms, to start promise chain
    delay(0, () => {
      B.do({
        action: 'gameaction/pick-card',
        card,
      });
    }).then(() => {
      return delay(AIActionDelay, () => {
        B.do(action);
      });
    });
  }
}

B.on('gameevent/turn', action => {
  db.select('game-states').push(db.get('game'));

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
  // debug(turnAction);
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

  if(db.get(['game-settings', 'fast-mode'])) {
    B.do(gameAction);
  } else {
    playAITurnAction(gameAction);
  }
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

  if(db.get(['game-settings', 'fast-mode'])) {
    B.do(gameAction);
  } else {
    delay(AIActionDelay, () => {
      B.do(gameAction);
    });
  }
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

  if(db.get(['game-settings', 'fast-mode'])) {
    B.do(gameAction);
  } else {
    delay(AIActionDelay, () => {
      B.do(gameAction);
    });
  }
});

B.on('game/exit', (action) => {
  timeouts.forEach(clearTimeout);
  timeouts = [];
});
