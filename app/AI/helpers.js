import _ from 'underscore';
import { canBuyCard } from 'app/validates';

export const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

export function hasEnoughResourceForCard(player, card) {
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


function identity(obj) {
  return obj;
}

export function flattenResources (resources) {
  return Object.keys(resources).reduce((flattenResources, key) => {
    return flattenResources.concat(
      _.times(resources[key], identity.bind(null, key))
    );
  }, []);
}

export function zipResources (resources) {
  return resources.reduce((obj, res) => {
    obj[res] = obj[res] || 0;
    obj[res] += 1;
    return obj;
  }, {});
}

export function playerBoughtCard(player, card) {
  if(!canBuyCard(player, card)) {
    return player;
  }

  const bonus = Object.assign({}, player.bonus, {
    [card.provides]: player.bonus[card.provides] + 1
  });

  let resources = Object.assign({}, player.resources);
  colors.forEach(color => {
    const pay = Math.max(card[color] - player.bonus[color], 0);
    const short = player.resources[color] - pay;
    if(short < 0) {
      resources[color] = 0;
      resources.gold += short;
    } else {
      resources[color] -= pay;
    }
  });

  return Object.assign({}, player, {
    bonus,
    resources,
  });
}
