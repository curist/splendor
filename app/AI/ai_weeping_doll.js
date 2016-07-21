import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
} from './helpers';
import { canBuyCard } from 'app/validates';

import Combinatorics from 'js-combinatorics';

import model from './nn_model';

const debug = require('debug')('app/AI/ai_weeping_doll');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

const TRAINING = true;
const LEARNING_RATE = 0.01;
const EPSILON = 0.6;

var avgCards = {
  1: {
    white: 0.825,
    blue: 0.825,
    green: 0.825,
    red: 0.825,
    black: 0.825,
    points: 0.125,
    provides: 'random',
  },
  2: {
    white: 1.37,
    blue: 1.37,
    green: 1.37,
    red: 1.37,
    black: 1.37,
    points: 1.83,
    provides: 'random',
  },
  3: {
    white: 2.15,
    blue: 2.15,
    green: 2.15,
    red: 2.15,
    black: 2.15,
    points: 4,
    provides: 'random',
  }
};

function normalize(max, value) {
  // let value be in 0 ~ 1
  return Math.min(Math.max((value || 0) / max, 0), 1);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function encodePlayer(player) {
  let features = [];
  // encode player state
  colors.forEach(color => {
    features.push(normalize(10, player.bonus[color]));
  });
  colors.forEach(color => {
    features.push(normalize(10, player.resources[color]));
  });
  features.push(normalize(10, player.resources.gold));

  for(let i = 0; i < 3; i++) {
    features = features.concat(encodeCard(player.reservedCards[i] || {}));
  }
  return features;
}

function encodeCard(card) {
  let features = [];
  // cost
  colors.forEach(color => {
    features.push(normalize(10, card[color]));
  });
  // provides bonus
  colors.forEach(color => {
    var provide = (card.provide == color) ? 1 : 0;
    if(card.provide == 'random') {
      provide = 0.2;
    }
    features.push(provide);
  });

  // TODO add bonus board value as feature
  // maybe board color sum or multiplier

  // score
  features.push(normalize(10, card.points));
  return features;
}

function encodeNoble(player, noble) {
  let features = [];
  // cost considering player color bonus
  colors.forEach(color => {
    features.push(normalize(10, noble[color] - player.bonus[color]));
  });
  features.push(normalize(3, noble.points));
  return features;
}

function encodeGameState(game) {
  const { player, players, cards, nobles, resources, deckRemainings } = game;
  let features = [];

  features = features.concat(encodePlayer(player));

  // TODO encode other player's state

  // cards on board
  for(let i = 0; i < 12; i++) {
    features = features.concat(encodeCard(cards[i] || {}));
  }

  // nobles
  for(let i = 0; i < 5; i++) {
    features = features.concat(encodeNoble(player, nobles[i] || {}));
  }

  // cards remaining in each deck
  for(let i = 1; i <= 3; i++) {
    features.push(normalize(40, deckRemainings[i]));
  }

  // resources
  colors.forEach(color => {
    features.push(normalize(10, resources[color]));
  });
  features.push(normalize(10, resources.gold));

  return features;
}

function encodeAction(action) {
  const { action: actionName } = action;
  let features = [];
  if(actionName == 'buy') {
    features = features.concat(encodeCard(action.card));
  } else {
    features = features.concat(encodeCard({}));
  }
  if(actionName == 'hold') {
    features = features.concat(encodeCard(action.card));
  } else {
    features = features.concat(encodeCard({}));
  }
  colors.forEach(color => {
    features.push(normalize(10, (action.resources || {})[color]));
  });
  return features;
}

function evalPlayer(player) {
  let score = player.score;

  let colorScore = 0;
  colors.forEach(color => {
    colorScore += normalize(100, player.bonus[color]);
    colorScore += normalize(200, player.resources[color]);
  });
  colorScore += normalize(150, player.resources.gold);

  let holdScore = 0;
  player.reservedCards.forEach(card => {
    holdScore += normalize(500, card.points);
  });
  // debug(score, colorScore, holdScore);
  return score + colorScore + holdScore;

}

function playerBoughtCard(player, state, card) {
  if(!canBuyCard(player, card)) {
    return state;
  }
  let futurePlayer = clone(player);
  let futureState = clone(state);

  colors.forEach(color => {
    const pay = Math.max(card[color] - player.bonus[color], 0);
    const short = player.resources[color] - pay;
    if(short < 0) {
      futurePlayer.resources[color] = 0;
      futurePlayer.resources.gold += short;
    } else {
      futurePlayer.resources[color] -= pay;
    }
  });

  if(card.status == 'hold') {
    futurePlayer.reservedCards = futurePlayer.reservedCards.filter(cardo => {
      return cardo.key !== card.key;
    });
  } else {
    futureState.cards = futureState.cards.filter(cardo => {
      return cardo.key !== card.key;
    });
    if(state.deckRemainings[card.rank] > 0) {
      state.deckRemainings[card.rank] -= 1;
      futureState.cards.push(avgCards[card.rank]);
    }
  }

  futureState.player = futurePlayer;
  futureState.players = futureState.players.map(player => {
    if(player.key == futurePlayer.key) {
      return futurePlayer;
    }
    return player;
  });
  return futureState;
}

function playerTakeResources(player, state, resources) {
  let futurePlayer = clone(player);
  let futureState = clone(state);
  Object.keys(resources).forEach(color => {
    futurePlayer.resources[color] += resources[color];
    futureState.resources[color] -= resources[color];
  });
  futureState.player = futurePlayer;
  futureState.players = futureState.players.map(player => {
    if(player.key == futurePlayer.key) {
      return futurePlayer;
    }
    return player;
  });
  return futureState;
}

function playerHoldCard(player, state, card) {
  let futurePlayer = clone(player);
  let futureState = clone(state);

  if(state.resources.gold > 0) {
    futurePlayer.resources.gold += 1;
    futureState.resources.gold -= 1;
  }

  futurePlayer.reservedCards = futurePlayer.reservedCards.concat(card);

  futureState.player = futurePlayer;
  futureState.players = futureState.players.map(player => {
    if(player.key == futurePlayer.key) {
      return futurePlayer;
    }
    return player;
  });
  futureState.cards = futureState.cards.filter(cardo => {
    return cardo.key !== card.key;
  });
  if(state.deckRemainings[card.rank] > 0) {
    state.deckRemainings[card.rank] -= 1;
    futureState.cards.push(avgCards[card.rank]);
  }
  return futureState;
}

function predictState(state, action) {
  const { player } = state;
  const { action: actionName } = action;
  if(actionName == 'buy') {
    return playerBoughtCard(player, state, action.card);
  } else if(actionName == 'hold') {
    return playerHoldCard(player, state, action.card);
  } else {
    return playerTakeResources(player, state, action.resources);
  }
}

function mse(v, expected) {
  return Math.pow(expected - v, 2) / 2;
}

export default class WeepingDoll {
  constructor (store, playerIndex, playerCount, winGameScore) {
    this.store = store;
    this.playerIndex = playerIndex;
    this.playerCount = playerCount;
    this.winGameScore = winGameScore;


    this.prevFeatures = null;
  }

  getAllActions(state) {
    const { player } = state;
    let actions = [];

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    actions = actions.concat(affordableCards.map(card => {
      return {
        action: 'buy',
        card,
      };
    }));

    const availableColors = colors.filter(color => {
      return state.resources[color] > 0;
    });

    let cmb = Combinatorics.combination(
      availableColors, Math.min(3, availableColors.length));
    for(let res = cmb.next(); res; res = cmb.next()) {
      actions.push({
        action: 'resource',
        resources: zipResources(res),
      });
    }

    actions = actions.concat(state.cards.map(card => {
      return {
        action: 'hold',
        card,
      };
    }));

    return actions;
  }

  turn (state) {
    const { player } = state;

    const actions = this.getAllActions(state);
    let action;
    const gameFeatures = encodeGameState(state);
    if(Math.random() > EPSILON) { // take best action
      action = actions.sort((actionA, actionB) => {
        const featureA = gameFeatures.concat(encodeAction(actionA));
        const featureB = gameFeatures.concat(encodeAction(actionB));
        const vA = model.net.activate(featureA)[0];
        const vB = model.net.activate(featureB)[0];
        return vB - vA;
      })[0];
    } else { // take a random move
      action = actions[Math.floor(Math.random() * actions.length)];
    }

    if(TRAINING) {
      // predict future state
      // and find best action for future state
      // and propagate current Q(s, a) -> r + Q(s', a')

      const futureState = predictState(state, action);
      const futureGameFeatures = encodeGameState(futureState);
      const futureAction = this.getAllActions(futureState).sort((actionA, actionB) => {
        const featureA = futureGameFeatures.concat(encodeAction(actionA));
        const featureB = futureGameFeatures.concat(encodeAction(actionB));
        const vA = model.net.activate(featureA)[0];
        const vB = model.net.activate(featureB)[0];
        return vB - vA;
      })[0];
      const futurePlayer = futureState.player;
      const currentFeatures = gameFeatures.concat(encodeAction(action));
      const futureFeatures = futureGameFeatures.concat(encodeAction(futureAction));
      const futureQ = model.net.activate(futureFeatures)[0];
      const target = evalPlayer(futurePlayer) + futureQ;

      model.net.activate(currentFeatures);
      model.net.propagate(LEARNING_RATE, target);
    }

    return action;
  }

  dropResources (state, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(0, 10));
  }

  pickNoble (state, nobles) {
    return nobles[0];
  }

  end (state) {
    if(TRAINING) {
      model.exportModel();
    }
  }
}

// some helper functions

function countResources (resources) {
  return Object.keys(resources).reduce((total, k) => {
    return total + resources[k];
  }, 0);
}

function getAffordableCards(player, cards) {
  return cards.filter(hasEnoughResourceForCard.bind(null, player));
}

function cardCost(player, card) {
  let shortOf = 0;
  let cost = 0;
  colors.forEach(color => {
    var short = card[color]
      - player.resources[color]
      - player.bonus[color];
    cost += Math.max(0, card[color] - player.bonus[color]);
    if(short > 0) {
      shortOf += short;
    }
  });
  return shortOf + cost;
}

function calcAllBonus(cards) {
  const allBonus = cards.reduce((bonus, card) => {
    colors.forEach(color => {
      bonus[color] += card[color] * (4 - card.rank);
    });
    return bonus;
  }, {
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
  });

  return allBonus;
}

function cardValue(player, card) {
  const w1 = 1.5 * (15 - player.score) / 15;
  const w2 = player.score / 15;
  const weight = w1 * (1 / (1 + cardCost(player, card))) +
    w2 * card.points;
  return weight;
}

function getBestCard(player, cards) {
  const sortedCards = cards.sort((cardA, cardB) => {
    return cardValue(player, cardB) - cardValue(player, cardA);
  });
  return sortedCards[0];
}
