import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
  playerBoughtCard,
} from './helpers';

const debug = require('debug')('app/AI/apocalypse');

let playerCount = 1;
let winGameScore = 15;

const DEBUG = true;

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

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

function realCardCost(player, card) {
  let cost = 0;
  colors.forEach(color => {
    let short = card[color] - player.bonus[color];
    if(short > 0) {
      cost += short;
    }
  });
  return cost;
}

function realCardCostWithPenalty(player, card) {
  let cost = 0;
  let penalty = 0;
  colors.forEach(color => {
    let short = card[color] - player.bonus[color];
    if(short > 0) {
      cost += short;
    }
    if(short > 3) {
      penalty += (short - 3) * 10;
    }
  });
  debug(`cost: ${cost}, penalty: ${penalty}`);
  return cost + penalty;
}

function cardCostWithPenalty(player, card) {
  let shortOf = 0;
  let cost = 0;
  let penalty = 0;
  colors.forEach(color => {
    var short = card[color]
      - player.resources[color]
      - player.bonus[color];
    cost += Math.max(0, card[color] - player.bonus[color]);
    if(cost > 4) {
      penalty += Math.pow(3, (cost - 4));
    }
    if(short > 0) {
      shortOf += short;
    }
  });
  debug(shortOf, cost, penalty);
  return shortOf + cost + penalty;
}


function cardPointsPerTurn(player, card) {
  const cost = realCardCost(player, card);
  return card.points / (1 + cost / 3);
}

function cardValue(player, state, cards, card) {
  const { nobles } = state;
  const { provides } = card;

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

  function cardBoardValue(player, cardToValue) {
    const futurePlayer = playerBoughtCard(player, card);
    const totalValue = cards.reduce((total, card) => {
      if(cardToValue.key == card.key) {
        return total;
      }
      return total + cardPointsPerTurn(futurePlayer, card);
    }, 0);
    return totalValue;
  }

  function turnsToEndGame(player, card, pointsToGo) {
    const futurePlayer = playerBoughtCard(player, card);
    const points = cards.filter(cardo => {
      return cardo.key !== card.key;
    }).map(card => {
      return cardPointsPerTurn(futurePlayer, card);
    }).filter(point => {
      return point > 0;
    }).sort().reverse();
    debug(points);

    let turns = 0;
    let score = 0;
    for(let i = 0, len = points.length; i < len || score >= pointsToGo ; i++) {
      score += points[i];
      turns++;
    }
    let penalty = Math.max(pointsToGo - score, 0) * 100;
    debug(`points to go: ${pointsToGo}, turns: ${turns}`);
    return turns + penalty;
  }

  function valueForPlayer(player, card) {
    const cost = realCardCostWithPenalty(player, card);

    const totalNobleValue = nobles.reduce((total, noble) => {
      return total + cardNobleValue(player, noble);
    }, 0);
    const heuristicPoints = cardPointsPerTurn(player, card) + totalNobleValue;
    debug(`per turn points: ${cardPointsPerTurn(player, card)}, noble: ${totalNobleValue}`);
    const turns = turnsToEndGame(player, card, winGameScore - heuristicPoints);
    return turns + cost;
  }

  return valueForPlayer(player, card);
}

function getBestCards(player, state, cards) {
  const { nobles } = state;
  const sortedCards = cards.map(card => {
    return Object.assign({
      value: cardValue(player, state, cards, card)
    }, card);
  }).sort((cardA, cardB) => {
    return cardA.value - cardB.value;
  });
  let fields = ['rank', 'key', 'total_cost', 'value', 'provides'].concat(colors);
  table(sortedCards, fields);
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
      diffTotal += (Math.log(diff) + 1) * (cards.length - i);
    }
  }
  const scarcity = (playerCount - 1) / (resources[color] + 3);
  return diffTotal + scarcity;
}

export default class Normal {
  constructor (store, playerIndex, pplCount, endScore) {
    this.store = store;
    this.playerIndex = playerIndex;
    winGameScore = endScore;
    playerCount = pplCount;
  }

  turn (state) {
    const {player} = state;

    const allCards = state.cards.concat(player.reservedCards);
    const affordableCards = getAffordableCards(player, allCards);

    // try to buy the best card
    const card = getBestCard(player, state, allCards);
    const bestCards = getBestCards(player, state, allCards);
    const bestCard = bestCards[0];
    if(hasEnoughResourceForCard(player, bestCard)) {
      return {
        action: 'buy',
        card: bestCard,
      };
    }

    // if we can't buy the best card, take resources

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

    // hold a card
    const secondBestCard = getBestCard(player, state, state.cards);
    return {
      action: 'hold',
      card: secondBestCard,
    };
  }

  dropResources (state, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(10));
  }

  pickNoble (state, nobles) {
    return nobles[0];
  }
}

