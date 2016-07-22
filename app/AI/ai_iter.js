import _ from 'underscore';
var helpers = require('./helpers');
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
} from './helpers';

import { canBuyCard, canTakeNoble, shouldDropResources } from 'app/validates';
import Combinatorics from 'js-combinatorics';


const debug = require('debug')('app/AI/ai_iter');

const colors = [ 'white', 'blue', 'green', 'red', 'black' ];

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

function cardBoardValue(player, card, cards) {
  const { provides } = card;
  return cards.filter(c => {
    return c.key !== card.key;
  }).filter(c => {
    return c[provides] > player.bonus[provides];
  }).map(c => {
    return c[provides] - player.bonus[provides];
  }).reduce((sum, v) => {
    return sum + v;
  }, 0);
}

function cardNoblesValue(player, card, nobles) {
  const { provides } = card;
  return nobles.filter(noble => {
    return noble[provides] > player.bonus[provides];
  }).map(noble => {
    return noble[provides] - player.bonus[provides];
  }).reduce((sum, v) => {
    return sum + v;
  }, 0);
}


function potentialCardValue(player, card) {
  const totalShortOf = colors.reduce((total, color) => {
    const diff = Math.max(card[color] - player.bonus[color], 0);
    return total + diff;
  }, 0);
  return card.points / (totalShortOf + 1);
}

function evalPlayer(state, player) {
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

  function sum(arr) {
    return arr.reduce((total, n) => {
      return total + n;
    }, 0);
  }

  const allCards = state.cards.concat(player.reservedCards);

  const cardValues = allCards.map(card => {
    return potentialCardValue(player, card);
  }).sort().reverse();

  const takeN = Math.floor((15 - player.score) / 3);
  const boardValue = sum(cardValues.slice(0, takeN));

  // debug(score, colorScore, holdScore, boardValue);
  return score + colorScore + holdScore + boardValue;
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

  futurePlayer.bonus[card.provides] += 1;

  futurePlayer.score += card.points;
  if(card.status == 'hold') {
    futurePlayer.reservedCards = futurePlayer.reservedCards.filter(cardo => {
      return cardo.key !== card.key;
    });
  } else {
    futureState.cards = futureState.cards.filter(cardo => {
      return cardo.key !== card.key;
    });
    if(futureState.deckRemainings[card.rank] > 0) {
      futureState.deckRemainings[card.rank] -= 1;
      futureState.cards.push(avgCards[card.rank]);
    }
  }

  const affordableNobles = futureState.nobles.filter(noble => {
    return canTakeNoble(futurePlayer, noble);
  });

  if(affordableNobles.length > 0) {
    const noble = futureState.nobles.pop();
    futurePlayer.score += noble.points;
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
  if(shouldDropResources(futurePlayer)) {
    const res = zipResources(_.shuffle(flattenResources(futurePlayer.resources)).slice(0, 10));
    futurePlayer.resources = res;
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

export default class Iter {
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

    if(player.reservedCards < 3) {
      actions = actions.concat(state.cards.map(card => {
        return {
          action: 'hold',
          card,
        };
      }));
    }

    return actions;
  }

  iterateIntoTheFuture (state, iters) {
    const actions = this.getAllActions(state);
    if(iters == 0) {
      const sortedActions = actions.sort((actionA, actionB) => {
        const futureStateA = predictState(state, actionA);
        const futureStateB = predictState(state, actionB);
        const futurePlayerA = futureStateA.player;
        const futurePlayerB = futureStateB.player;
        const valueA = evalPlayer(futureStateA, futurePlayerA);
        const valueB = evalPlayer(futureStateB, futurePlayerB);
        return valueB - valueA;
      });
      return sortedActions[0];
    }

    const sortedActions = actions.sort((actionA, actionB) => {
      const futureStateA = predictState(state, actionA);
      const futureStateB = predictState(state, actionB);
      const futureActionA = this.iterateIntoTheFuture(futureStateA, iters - 1);
      const futureActionB = this.iterateIntoTheFuture(futureStateB, iters - 1);
      const ffStateA = predictState(futureStateA, futureActionA);
      const ffStateB = predictState(futureStateB, futureActionB);
      const futurePlayerA = ffStateA.player;
      const futurePlayerB = ffStateB.player;
      const valueA = evalPlayer(ffStateA, futurePlayerA);
      const valueB = evalPlayer(ffStateB, futurePlayerB);
      return valueB - valueA;
    });
    return sortedActions[0];
  }

  turn (state) {
    const actions = this.getAllActions(state);
    const groupedActions = _(actions).groupBy(action => {
      return action.action;
    });

    // force check if we are winning
    if(groupedActions.buy) {
      let maxScore = 0;
      let winningAction;
      for(let i = 0; i < groupedActions.buy.length; i++) {
        const action = groupedActions.buy[i];
        const futureState = predictState(state, action);
        const futurePlayer = futureState.player;
        if(futurePlayer.score > maxScore) {
          maxScore = futurePlayer.score;
          winningAction = action;
        }
      }
      if(winningAction) {
        return winningAction;
      }
    }

    // choose best action..
    const action = this.iterateIntoTheFuture(state, 2);
    return action;
  }

  dropResources (state, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(0, 10));
  }

  pickNoble (state, nobles) {
    return nobles[0];
  }
}

// some helper functions

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
  return shortOf * 3 + cost;
}

function sumPlayerResources(player) {
  return Object.keys(player.resources).reduce((sum, color) => {
    return sum + player.resources[color];
  }, 0);
}

function cardValue(player, state, cards, card) {
  const nobles = state.nobles;
  const provides = card.provides;

  function cardNobleValue(player, noble) {
    // card don't provide noble's need
    if(noble[provides] == 0) {
      return 0;
    }
    // already satisfied noble's need
    if(player.bonus[provides] >= noble[provides]) {
      return 0;
    }
    const totalShortOf = colors.reduce((total, color) => {
      const diff = Math.max(noble[color] - player.bonus[color], 0);
      return total + diff;
    }, 0);
    return 3 / totalShortOf;
  }

  function cardCardValue(player, card, cardToValue) {
    const provides = cardToValue.provides;
    if(card[provides] == 0) {
      return 0;
    }
    // already satisfied card's need
    if(player.bonus[provides] >= card[provides]) {
      return 0;
    }
    const totalShortOf = colors.reduce((total, color) => {
      const diff = Math.max(card[color] - player.bonus[color], 0);
      return total + diff;
    }, 0);
    return card.points / totalShortOf;
  }

  function cardBoardValue(player, card) {
    const cardToValue = card;
    const totalValue = cards.reduce((total, card) => {
      return total + cardCardValue(player, card, cardToValue);
    }, 0);
    return totalValue;
  }

  function valueForPlayer(player, card) {
    const provides = card.provides;
    const cost = cardCost(player, card);

    const totalNobleValue = nobles.reduce((total, noble) => {
      return total + cardNobleValue(player, noble);
    }, 0);
    const value = card.points + totalNobleValue + cardBoardValue(player, card);
    return value - cost;
  }

  return valueForPlayer(player, card);
}

function getBestCards(player, state, cards) {
  const nobles = state.nobles;
  const sortedCards = cards.map(card => {
    return Object.assign({
      value: cardValue(player, state, cards, card)
    }, card);
  }).sort((cardA, cardB) => {
    return cardB.value - cardA.value;
  });
  return sortedCards;
}

function getBestCard(player, state, cards) {
  return getBestCards(player, state, cards)[0];
}

function colorValue(player, cards, state, color) {
  const resources = state.resources;
  let diffTotal = 0;
  for(let i = 0; i < cards.length; i++) {
    let card = cards[i];
    let diff = card[color] - player.resources[color] - player.bonus[color];
    if(diff > 0) {
      diffTotal += diff * (cards.length - i);
    }
  }
  const scarcity = 10 - resources[color];
  return diffTotal + scarcity;
}
