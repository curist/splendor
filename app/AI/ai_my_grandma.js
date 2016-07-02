import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
  playerBoughtCard,
} from './helpers';

import { canBuyCard, canTakeNoble } from 'app/validates';

const DEBUG = false;
const debug = require('debug')('app/AI/my_grandma');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

let winGameScore, playerIndex, playerCount;

function table(data, fields) {
  if(!DEBUG) {
    return;
  }
  if(fields) {
    window['console'].table(data, fields);
  } else {
    window['console'].table([data]);
  }
}

function countResources (resources) {
  return Object.keys(resources).reduce((total, k) => {
    return total + resources[k];
  }, 0);
}

function getAffordableCards(player, cards) {
  return cards.filter(hasEnoughResourceForCard.bind(null, player));
}

function expCardCost(player, card) {
  let cost = 1;
  colors.forEach(color => {
    const short = card[color] - player.bonus[color];
    if(short > 0) {
      cost += Math.pow(2, short);
    }
  });
  return cost;
}

function cardCost(player, card) {
  let cost = 0;
  colors.forEach(color => {
    const short = card[color] - player.bonus[color];
    if(short > 0) {
      cost += short;
    }
  });
  return cost;
}

function calcColorsTotal(cards) {
  const allColors = cards.reduce((colorCount, card) => {
    colors.forEach(color => {
      colorCount[color] += card[color];
    });
    return colorCount;
  }, {
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
  });

  return allColors;
}

function calcColorFreq(cards) {
  const allColors = cards.reduce((colorCount, card) => {
    colors.forEach(color => {
      colorCount[color] += 1;
    });
    return colorCount;
  }, {
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
  });

  return allColors;
}

function provideColorPoints(player, card, provides) {
  // card don't provide card's need
  if(card[provides] == 0) {
    return 0;
  }
  // already satisfied card's need
  if(player.bonus[provides] >= card[provides]) {
    return 0;
  }
  if(card.points == 0) {
    return 0;
  }
  const totalShortOf = colors.reduce((total, color) => {
    const diff = Math.max(card[color] - player.bonus[color], 0);
    return total + diff;
  }, 0);
  return card.points / (totalShortOf + player.resources[provides] / 2);
}

function provideNoblePoints(player, noble, provides) {
  // card don't provide noble's need
  if(noble[provides] == 0) {
    return 0;
  }
  // already satisfied noble's need
  if(player.bonus[provides] >= noble[provides]) {
    return 0;
  }
  const totalShortOf = colors.reduce((total, color) => {
    const bonus = Math.max(0, player.bonus[color]);
    const diff = Math.max(noble[color] - bonus, 0);
    return total + diff;
  }, 0);
  return noble.points / totalShortOf;

}

function cardValue(player, state, cards, card) {
  const { nobles } = state;
  const { provides } = card;

  function sum(arr) {
    return arr.reduce((total, n) => {
      return total + n;
    }, 0);
  }

  function cardBoardPoints(player, card) {
    const { key, provides } = card;
    const cardValues = cards.map(card => {
      if(key == card.key) {
        return 0;
      }
      return provideColorPoints(player, card, provides);
    }).sort().reverse();

    const takeN = Math.floor((winGameScore - player.score) / 3);
    const totalValue = sum(cardValues.slice(0, takeN));
    // debug(takeN, totalValue);
    // debug(cardValues);
    return totalValue;
  }

  function valueForPlayer(player, card) {
    const { provides } = card;
    const cost = expCardCost(player, card);

    const totalNobleValue = nobles.reduce((total, noble) => {
      return total + provideNoblePoints(player, noble, provides);
    }, 0);
    const value = card.points + totalNobleValue + cardBoardPoints(player, card);
    // debug(card);
    // debug(card.rank, value, card.total_cost, cost, value/cost);
    return value / cost;
  }

  // const valueForAllOtherPlayers = state.players.reduce((valueSum, ppl) => {
  //   if(ppl.key == player.key) {
  //     return valueSum;
  //   }
  //   return valueSum + valueForPlayer(ppl, card);
  // }, 0);

  return valueForPlayer(player, card);
}

function secondPassCardValue(player, cards, cardToValue) {
  function cardCardValue(player, card, cardToValue) {
    const { provides } = cardToValue;
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
    return card.value / totalShortOf;
  }

  const totalValue = cards.reduce((total, card) => {
    return total + cardCardValue(player, card, cardToValue);
  }, 0);
  return totalValue;
}

function getBestCards(player, state, cards) {
  const { nobles } = state;
  const cardsWithEstimateValue = cards.map(card => {
    const value = cardValue(player, state, cards, card);
    return Object.assign({ value }, card);
  });

  // let fields = ['rank', 'key', 'total_cost', 'value', 'provides'].concat(colors);
  // table(cardsWithEstimateValue, fields);

  // const cardsWithEstimateValue = cards.map(card => {
  //   const value = cardValue(player, state, cards, card);
  //   return Object.assign({ value }, card);
  // });

  const cardsReValue = cardsWithEstimateValue.map(cardToValue => {
    // given we bought this card, what's most valuable next move?

    const futurePlayer = playerBoughtCard(player, cardToValue);

    const nextTopCards = cards.map(card => {
      let revalue = 0;
      if(card.key != cardToValue.key) {
        revalue = cardValue(futurePlayer, state, cards, card);
      }
      return Object.assign({ revalue }, card);
    }).sort((cardA, cardB) => {
      return cardB.revalue - cardA.revalue;
    });
    const nextBestCard = nextTopCards[0];

    let allPoints = 0;
    if(canBuyCard(player, cardToValue)) {
      allPoints += cardToValue.points;

      const affordableNobles = nobles.filter(noble => {
        return canTakeNoble(futurePlayer, noble);
      });
      if(affordableNobles.length > 0) {
        allPoints += 3;
      }
    }
    const cardPoints = cards.map(card => {
      let points = 0;
      if(cardToValue.key == card.key) {
        return 0;
      }
      if(canBuyCard(futurePlayer, card)) {
        points += card.points;

        const futureFuturePlayer = playerBoughtCard(futurePlayer, card);
        const affordableNobles = nobles.filter(noble => {
          return canTakeNoble(futureFuturePlayer, noble);
        });
        if(affordableNobles.length > 1) {
          points += 3;
        }

      }
      return points;
    });
    // debug('allpts: ' + allPoints);
    // debug('max:' + Math.max.apply(null, cardPoints));

    allPoints += Math.max.apply(null, cardPoints);
    const callGame = (player.score + allPoints >= winGameScore) ? 100 : 0;
    return Object.assign({
      revalue: nextBestCard.revalue,
      nextBestKey: nextBestCard.key,
      allPoints,
      trueValue: cardToValue.value + nextBestCard.revalue * 0.25 + callGame,
    }, cardToValue);
  });

  // let rfields = ['rank', 'key', 'total_tost', 'revalue', 'provides'].concat(colors);
  // table(cardsReValue, rfields);

  const sortedCards = cardsReValue .sort((cardA, cardB) => {
    const cardValueB = cardB.trueValue;
    const cardValueA = cardA.trueValue;
    return cardValueB - cardValueA;
  });

  // const sortedCards = cardsReValue.sort((cardA, cardB) => {
  //   return cardB.revalue - cardA.revalue;
  // });
  // const sortedCards = cardsWithEstimateValue.sort((cardA, cardB) => {
  //   return (cardB.value + cardB.revalue * 0.5) -
  //     (cardA.value + cardA.revalue * 0.5);
  // });
  let sfields = ['key', 'nextBestKey', 'points', 'value', 'revalue', 'trueValue', 'allPoints', 'provides'].concat(colors);
  table(sortedCards, sfields);
  return sortedCards;
}

function getBestCard(player, state, cards) {
  return getBestCards(player, state, cards)[0];
}

function colorValue(player, cards, state, color) {
  const { resources } = state;
  let diffTotal = 0;
  for(let i = 0; i < cards.length; i++) {
    let card = cards[i];
    let diff = card[color] - player.resources[color] - player.bonus[color];
    if(diff > 0) {
      diffTotal += diff * (cards.length - i);
    }
  }
  const scarcity = (playerCount - 1) / (resources[color] + 3);
  return diffTotal + scarcity;
}

export default class MyGrandMa {
  constructor (store, myIndex, pplCount, endScore) {
    this.store = store;
    playerIndex = myIndex;
    playerCount = pplCount;
    winGameScore = endScore;
  }

  turn (state) {
    const {player} = state;

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    // try to buy the best card
    const bestCards = getBestCards(player, state, allCards);
    const bestCard = bestCards[0];
    table(bestCard);
    if(bestCard && hasEnoughResourceForCard(player, bestCard)) {
      return {
        action: 'buy',
        card: bestCard,
      };
    }

    // if we can't buy the best card, take resources

    const allBonus = calcColorsTotal(allCards);
    const resCount = countResources(player.resources);
    const topCards = bestCards.slice(0,3);
    if(resCount <= 7) {
      const availableColors = colors.filter(color => {
        return state.resources[color] > 0;
      });
      const pickColors = availableColors.sort((colorA, colorB) => {
        const value_b = colorValue(player, topCards, state, colorB);
        const value_a = colorValue(player, topCards, state, colorA);
        return value_b - value_a;
      }).slice(0, 3);
      return {
        action: 'resource',
        resources: zipResources(pickColors),
      };
    }

    // we already have plenty of resources, buy a affordable card
    const affordableBestCard = getBestCard(player, state, affordableCards);
    if(affordableBestCard) {
      return {
        action: 'buy',
        card: affordableBestCard,
      };
    }

    const secondBestCard = getBestCard(player, state, state.cards);
    // hold the card
    return {
      action: 'hold',
      card: secondBestCard,
    };
  }

  dropResources (state, resources) {
    const {player} = state;
    const allCards = state.cards.concat(player.reservedCards);
    const topCards = getBestCards(player, state, allCards).slice(0, 3);

    const sortedResources = flattenResources(resources).sort((colorA, colorB) => {
      const value_b = colorValue(player, topCards, state, colorB);
      const value_a = colorValue(player, topCards, state, colorA);
      return value_b - value_a;
    });

    return zipResources(sortedResources.slice(0, 10));
  }

  pickNoble (state, nobles) {
    const i = Math.floor(nobles.length * Math.random());
    return nobles[i];
  }
}

