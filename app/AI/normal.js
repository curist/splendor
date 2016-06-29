import _ from 'underscore';

const debug = require('debug')('app/AI/normal');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

function identity(obj) {
  return obj;
}

function countResources (resources) {
  return Object.keys(resources).reduce((total, k) => {
    return total + resources[k];
  }, 0);
}

function flattenResources (resources) {
  return Object.keys(resources).reduce((flattenResources, key) => {
    return flattenResources.concat(
      _.times(resources[key], identity.bind(null, key))
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

function hasEnoughResourceForCard(player, card) {
  let shortOf = 0;
  colors.forEach(color => {
    var short = card[color]
      - player.resources[color]
      - player.bonus[color];
    if(short > 0) {
      shortOf += short;
    }
  });
  return shortOf <= player.resources.gold;
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
  return shortOf * 2 + cost;
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

function cardValue(player, state, cards, card) {
  const { nobles } = state;
  const { provides } = card;
  const colorsTotal = calcColorsTotal(cards);
  const colorsFreq = calcColorFreq(cards);

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
    const { provides } = card;
    const cost = cardCost(player, card);

    const totalNobleValue = nobles.reduce((total, noble) => {
      return total + cardNobleValue(player, noble);
    }, 0);
    const value = card.points + totalNobleValue + cardBoardValue(player, card);
    return value - cost;
  }

  // const valueForAllPlayers = state.players.reduce((valueSum, player) => {
  //   return valueSum + valueForPlayer(player, card);
  // }, 0);

  return valueForPlayer(player, card);
}

function getBestCards(player, state, cards) {
  const { nobles } = state;
  const sortedCards = cards.sort((cardA, cardB) => {
    return cardValue(player, state, cards, cardB) -
      cardValue(player, state, cards, cardA);
  });
  return sortedCards;
}

function getBestCard(player, state, cards) {
  return getBestCards(player, state, cards)[0];
}

function colorValue(player, cards, color) {
  // const value_a = (goalCard[colorA] + 1) * (allBonus[colorA]/10 + 1);
  // const colorSum = calcColorsTotal(cards);
  // return colorSum[color]; // - (player[color]);
  let diffTotal = 0;
  for(let i = 0; i < cards.length; i++) {
    let card = cards[i];
    let diff = card[color] - player.resources[color] - player.bonus[color];
    if(diff > 0) {
      diffTotal += diff * (cards.length - i);
    }
  }
  return diffTotal;
}

export default class Normal {
  turn (state, playerIndex) {
    const player = state.players[playerIndex];

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    // 2. try to buy a card
    const card = getBestCard(player, state, affordableCards);
    if(card) {
      return {
        action: 'buy',
        card: card,
      };
    }

    const allBonus = calcColorsTotal(allCards);
    const resCount = countResources(player.resources);
    const bestCards = getBestCards(player, state, allCards).slice(0,2);
    // 1. take resources
    if(resCount <= 7) {
      const availableColors = colors.filter(color => {
        return state.resources[color] > 0;
      });
      const pickColors = availableColors.sort((colorA, colorB) => {
        const value_b = colorValue(player, bestCards, colorB);
        const value_a = colorValue(player, bestCards, colorA);
        return value_b - value_a;
      }).slice(0, 3);
      return {
        action: 'resource',
        resources: zipResources(pickColors),
      };
    }

    const holdCard = getBestCard(player, state, state.cards) ||
      _.shuffle(state.cards)[0];
    // 3. hold a card
    return {
      action: 'hold',
      card: holdCard,
    };
  }

  dropResources (state, playerIndex, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(0, 10));
  }

  pickNoble (state, playerIndex, nobles) {
    return nobles[0];
  }
}

