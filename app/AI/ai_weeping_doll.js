import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
} from './helpers';

const debug = require('debug')('app/AI/ai_weeping_doll');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

function normalize(max, value) {
  return Math.min((value || 0) / max, 1);
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
    features.push(provide);
  });
  // score
  features.push(normalize(10, card.points));
  return features;
}

function encodeNoble(noble) {
  let features = [];
  // cost
  colors.forEach(color => {
    features.push(normalize(10, noble[color]));
  });
  // score
  features.push(normalize(10, noble.points));
  return features;
}

function encodeGameState(game) {
  const { player, players, cards, nobles, resources, deckRemaingings } = game;
  let features = [];

  features = features.concat(encodePlayer(player));

  // TODO encode other player's state

  // cards on board
  for(let i = 0; i < 12; i++) {
    features = features.concat(encodeCard(cards[i] || {}));
  }

  // nobles
  for(let i = 0; i < 5; i++) {
    features = features.concat(encodeNoble(nobles[i] || {}));
  }

  // cards remaining in each deck
  for(let i = 0; i < 3; i++) {
    features.push(normalize(40, deckRemaingings[i]));
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

  colors.forEach(color => {
    score += normalize(200, player.bonus[color]);
    score += normalize(200, player.resources[color]);
  });
  score += normalize(200, player.resources.gold);

  player.reservedCards.forEach(card => {
    score += normalize(300, card.points);
  });
  return score;

}

export default class WeepingDoll {
  constructor (store, playerIndex, playerCount, winGameScore) {
    this.store = store;
    this.playerIndex = playerIndex;
    this.playerCount = playerCount;
    this.winGameScore = winGameScore;
  }

  chooseAction(state) {
    // actions, either one of:
    // 1. buy a card
    // 2. hold a card
    // 3. take resources
    const {player} = state;

    debug(evalPlayer(player));
    debug(encodeGameState(state));

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    // 2. try to buy a card
    const card = getBestCard(player, affordableCards);
    if(card) {
      return {
        action: 'buy',
        card: card,
      };
    }

    const allBonus = calcAllBonus(allCards);
    const resCount = countResources(player.resources);
    const goalCard = getBestCard(player, allCards) || {};
    // 1. take resources
    if(resCount <= 7) {
      const availableColors = colors.filter(color => {
        return state.resources[color] > 0;
      });
      const pickColors = availableColors.sort((colorA, colorB) => {
        const value_b = (goalCard[colorB] + 1) * (allBonus[colorB]/10 + 1);
        const value_a = (goalCard[colorA] + 1) * (allBonus[colorA]/10 + 1);
        return value_b - value_a;
      }).slice(0, 3);
      return {
        action: 'resource',
        resources: zipResources(pickColors),
      };
    }

    // 3. hold a card
    return {
      action: 'hold',
      card: _.shuffle(state.cards)[0],
    };
  }

  turn (state) {
    const action = this.chooseAction(state);
    debug(encodeAction(action));
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
