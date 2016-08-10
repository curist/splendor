import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
} from './helpers';
import { canTakeNoble } from 'app/validates';

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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
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
  let cost = 0;
  colors.forEach(color => {
    let short = card[color] - player.bonus[color];
    if(short > 0) {
      cost += short;
    }
  });
  return cost;
}

function cardCostWithPenalty(player, card, resources) {
  const turnsToTakeResources = Math.floor((10 - countResources(player.resources)) / 3);
  let cost = 0;
  let penalty = 0;
  colors.forEach(color => {
    let colorCost = card[color] - player.bonus[color];
    if(colorCost > 0) {
      cost += colorCost;
    }
    let short = colorCost - player.resources[color];
    if(short > turnsToTakeResources) {
      penalty += (short - turnsToTakeResources) * 3;
    }
    // unreachable
    if(short > resources[color]) {
      penalty += 100;
    }
  });
  return cost + penalty;
}

function cardCostWithoutCurrentResource(player, card, resources) {
  let cost = 0;
  let penalty = 0;
  colors.forEach(color => {
    let colorCost = card[color] - player.bonus[color];
    if(colorCost > 0) {
      cost += colorCost;
    }
    // unreachable
    if(colorCost > resources[color]) {
      penalty += 100;
    }
  });
  return cost + penalty;
}

function cardPointsPerTurn(player, card, resources) {
  const cost = cardCostWithPenalty(player, card, resources);
  return card.points / (1 + cost / 3);
}

function playerBoughtCard(player, card) {
  let futurePlayer = clone(player);
  futurePlayer.bonus[card.provides] += 1;
  colors.forEach(color => {
    const cost = card[color] - player.bonus[color];
    futurePlayer.resources[color] -= Math.max(0, cost);
  });
  return futurePlayer;
}

function cardValue(player, state, cards, card, print) {
  const { nobles, resources } = state;
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
    let futurePlayer = playerBoughtCard(player, cardToValue);
    const totalValue = cards.reduce((total, card) => {
      if(cardToValue.key == card.key) {
        return total;
      }
      return total + cardPointsPerTurn(futurePlayer, card, resources);
    }, 0);
    return totalValue;
  }

  // function turnsToEndGame(player, card, pointsToGo) {
  //   let futurePlayer = playerBoughtCard(player, card);

  //   const effectivePoints = cards.filter(cardo => {
  //     return cardo.key !== card.key;
  //   }).filter(card => {
  //     return card.points > 0 && cardCostWithPenalty(player, card, resources) < 8;
  //   }).map(card => {
  //     return {
  //       key: card.key,
  //       ppt: cardPointsPerTurn(futurePlayer, card, resources),
  //       turns: 1 + cardCostWithPenalty(player, card, resources) / 3,
  //       points: card.points,
  //     };
  //   }).sort((cardA, cardB) => {
  //     return cardB.ppt - cardA.ppt;
  //   });

  //   let turns = 0;
  //   let score = 0;
  //   let pointCards = [];
  //   for(let i = 0, len = effectivePoints.length; i < len && score < pointsToGo ; i++) {
  //     let effectivePoint = effectivePoints[i];
  //     score += effectivePoint.points;
  //     turns += effectivePoint.turns;
  //     pointCards.push(effectivePoint);
  //   }
  //   debug(`ptg:${pointsToGo},turns:${turns}, score:${score}`);
  //   let penalty = Math.max(pointsToGo - score, 0) * 10;
  //   if(print) {
  //     table(pointCards, ['key', 'ppt', 'turns', 'points']);
  //   }
  //   return turns + penalty;
  // }

  function turnsToEndGame(player, allCards, nobles, resources, card, pointsToGo) {
    const cards = allCards.filter(cardo => {
      return cardo.key !== card.key;
    });
    // can't reach end game score, give penalties
    if(cards.length == 0) {
      let penalty = pointsToGo * 10;
      return penalty;
    }
    // roughly estimate if cards on board can end game
    const allCardPoints = allCards.reduce((total, card) => {
      return total + card.points;
    }, 0);
    // can't reach end game score, give penalties
    if(allCardPoints < pointsToGo) {
      let penalty = (pointsToGo - allCardPoints) * 20;
      return penalty;
    }

    const { provides } = card;
    let futurePlayer = clone(player);
    futurePlayer.bonus[provides] += 1;

    let takeCardPoints = card.points;
    let affordableNobleKey = -1;
    const affordableNoble = nobles.find(noble => {
      affordableNobleKey = noble.key;
      return canTakeNoble(futurePlayer, noble);
    });
    let remainNobles = nobles;
    if(affordableNoble) {
      takeCardPoints += 3;

      // filter out acquired noble
      remainNobles = nobles.filter(noble => {
        return noble.key !== affordableNobleKey;
      });
    }

    // reach end game score, no further ado
    if(pointsToGo - takeCardPoints <= 0) {
      // not returing real end game turns
      // we favor higher end game score
      // return pointToGo - takeCardPoints;
      // ^^^ or we check this outside of this function???

      // buy this card to end game, take these turns
      return 1 + cardCostWithoutCurrentResource(player, card, resources) / 3;
    }

    const cardsCanEndGameInTurns = cards.map(card => {
      const turns = turnsToEndGame(futurePlayer, cards, remainNobles, resources, card, pointsToGo - takeCardPoints);
      return turns;
    }).filter(turns => {
      return turns < 10;
    }).sort();
    if(cardsCanEndGameInTurns.length > 0) {
      // sort them by minimal turns to end game
      // if two cards can end game in same turns
      // pick higher points one
      return cardsCanEndGameInTurns[0];
    }


    const effectivePoints = cards.filter(cardo => {
      return cardo.key !== card.key;
    }).filter(card => {
      return card.points > 0 && cardCostWithoutCurrentResource(player, card, resources) < 8;
    }).map(card => {
      return {
        key: card.key,
        ppt: cardPointsPerTurn(futurePlayer, card, resources),
        turns: 1 + cardCostWithoutCurrentResource(player, card, resources) / 3,
        points: card.points,
      };
    }).sort((cardA, cardB) => {
      return cardB.ppt - cardA.ppt;
    });

    let turns = 0;
    let score = 0;
    let pointCards = [];
    for(let i = 0, len = effectivePoints.length; i < len && score < pointsToGo ; i++) {
      let effectivePoint = effectivePoints[i];
      score += effectivePoint.points;
      turns += effectivePoint.turns;
      pointCards.push(effectivePoint);
    }
    debug(`ptg:${pointsToGo},turns:${turns}, score:${score}`);
    let penalty = Math.max(pointsToGo - score, 0) * 10;
    if(print) {
      table(pointCards, ['key', 'ppt', 'turns', 'points']);
    }
    return turns + penalty;
  }

  function valueForPlayer(player, card) {
    const costWithPenalty = cardCostWithPenalty(player, card, resources);
    // const noblePoints = nobles.map(noble => {
    //   return cardNobleValue(player, noble);
    // }).sort().reverse();

    // const actionScore = card.points + (noblePoints[0] || 0);
    const pointsToGo = winGameScore - player.score;
    const turns = turnsToEndGame(player, cards, nobles, resources, card, pointsToGo);

    // debug(`k:${card.key},turns:${turns},penalty:${costWithPenalty/3},as:${actionScore}`);
    return turns + Math.ceil(costWithPenalty / 3);
  }

  return valueForPlayer(player, card);
}

function reachableCardValue(player, cards, resources, cardToValue) {
  const cost = cardCostWithPenalty(player, cardToValue, resources);
  let futurePlayer = playerBoughtCard(player, cardToValue);

  function cardBoardValue() {
    const totalValue = cards.reduce((total, card) => {
      if(cardToValue.key == card.key) {
        return total;
      }
      return total + cardPointsPerTurn(futurePlayer, card, resources);
    }, 0);
    return totalValue;
  }
  return cardBoardValue() - cost;
}

function getBestCards(player, state, cards) {
  if(cards.length == 0) {
    return [];
  }
  const { nobles, resources } = state;
  const sortedCards = cards.map(card => {
    return Object.assign({
      turns: cardValue(player, state, cards, card)
    }, card);
  }).sort((cardA, cardB) => {
    // smaller, the better
    return cardA.turns - cardB.turns;
  });
  if(sortedCards[0].turns < 15) {
    let fields = ['rank', 'key', 'total_cost', 'turns', 'provides'].concat(colors);
    // debug('good sorted card');
    table(sortedCards, fields);
    cardValue(player, state, cards, sortedCards[0], true);
    return sortedCards;
  }
  const reachableSortedCards = cards.map(card => {
    return Object.assign({
      value: reachableCardValue(player, cards, resources, card)
    }, card);
  }).sort((cardA, cardB) => {
    return cardB.value - cardA.value;
  });
  let fields1 = ['rank', 'key', 'total_cost', 'points', 'value'].concat(colors);
  // debug('reachable sorted card');
  table(reachableSortedCards, fields1);
  return reachableSortedCards;
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

