import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
} from './helpers';

const debug = require('debug')('app/AI/dumb');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

function countResources (resources) {
  return Object.keys(resources).reduce((total, k) => {
    return total + resources[k];
  }, 0);
}

function getAffordableCards(player, cards) {
  return cards.filter(hasEnoughResourceForCard.bind(null, player));
}

function getBestCard(cards) {
  const sortedCards = cards.sort((cardA, cardB) => {
    return cardB.points - cardA.points;
  });
  return sortedCards[0];
}

export default class Dumb {

  constructor (store, playerIndex, playerCount, winGameScore) {
    this.store = store;
    this.playerIndex = playerIndex;
    this.playerCount = playerCount;
    this.winGameScore = winGameScore;
  }
  // state = {
  //   player: player,
  //   cards: [{
  //     black : 0,
  //     blue : 0,
  //     green : 7,
  //     red : 3,
  //     white : 0,
  //     points : 5,
  //     provides : "red",
  //     rank : 3,
  //     total_cost : 10,
  //     key: 83,
  //   }],
  //   players: [{
  //     bonus: {
  //       white: 0,
  //       blue: 0,
  //       green: 0,
  //       red: 0,
  //       black: 0
  //     },
  //     resources: {
  //       white: 0,
  //       blue: 0,
  //       green: 0,
  //       red: 0,
  //       black: 0,
  //       gold: 0
  //     },
  //     score: 0,
  //     reservedCards: [card]
  //   }],
  //   nobles: [{
  //     black : 0,
  //     blue : 0,
  //     green : 4,
  //     red : 4,
  //     white : 0,
  //     points : 3,
  //     key : 3,
  //   }],
  //   resources: {red: 1, black:1, ..., gold: 1},
  //   deckRemainings: { 1: 36, 2: 26, 3: 16 },
  // }
  //
  // returns:
  //   return {
  //     action: 'buy',
  //     card: card,
  //   }
  //   return {
  //     action: 'hold',
  //     card: card,
  //   }
  //   return {
  //     action: 'resources',
  //     resources: {
  //       blue: 1,
  //       yellow: 1,
  //     },
  //   }
  turn (state) {
    // actions
    // 1. buy a card
    // 2. hold a card
    // 3. take resources
    // strategry:
    //   1. take resources when having total <= 7
    //   2. buy a card otherwise
    //      a. having points better
    //   3. hold a card otherwise
    const {player} = state;

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    // 2. try to buy a card
    const card = getBestCard(affordableCards);
    if(card) {
      return {
        action: 'buy',
        card: card,
      };
    }

    const resCount = countResources(player.resources);
    // 1. take resources
    if(resCount <= 7) {
      const availableColors = colors.filter(color => {
        return state.resources[color] > 0;
      });
      const pickColors = _.shuffle(availableColors).slice(0, 3);
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

  dropResources (state, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(0, 10));
  }

  pickNoble (state, nobles) {
    return nobles[0];
  }
}

