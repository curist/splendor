import {colors} from 'app/data/game-setting';

export function canBuyCard(player, card) {
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

export function canHoldCard(player, card) {
  // XXX maybe also check if player is holding > 3 cards
  return card.status == 'board';
}

export function canTakeResources(resources, takingResources) {
  let sum = 0;
  let took2sameColor = false;

  // should not be able to take gold
  if(takingResources.gold > 0) {
    return false;
  }

  for(let i = 0; i < colors.length; i++) {
    let color = colors[i];
    if(takingResources[color] > resources[color]) {
      return false;
    }
    if(takingResources[color] >= 2) {
      took2sameColor = true;
    }
    sum += takingResources[color];
  }
  if(sum > 3) {
    return false;
  }
  if(took2sameColor && sum !== 2) {
    return false;
  }
  return true;
}

export function shouldDropResources(player) {
  const resourcesCount = Object.keys(player.resources).map(color => {
    return player.resources[color];
  }).reduce((sum, count) => {
    return sum + count;
  });

  return resourcesCount > 10;
}

export function canDropResources(player, resources) {
  for(let color in resources) {
    if(resources[color] > player[color]) {
      return false;
    }
  }
  return true;
}

export function canTakeNoble(player, noble) {
  const passedResources = colors.filter(color => {
    return player.bonus[color] >= noble[color];
  });
  // should all pass
  return passedResources.length == 5;
}

export function validateActions(player, resources, action) {
  const actor = `${player.key}:${player.actor}`;
  const actionName = action.action;
  if(actionName == 'gameaction/acquire-card') {
    const { card } = action;
    if(!canBuyCard(player, card)) {
      throw new Error(`${actor} can't afford card: ${card.key}`);
    }
  } else if(actionName == 'gameaction/reserve-card') {
    const { card } = action;
    if(!canHoldCard(player, card)) {
      throw new Error(`${actor} can't hold target card: ${card.key}`);
    }
  } else if(actionName == 'gameaction/take-resources') {
    const takingResources = action.resources;
    if(!canTakeResources(resources, takingResources)) {
      throw new Error(`${actor} trying to take ${JSON.stringify(takingResources)}`);
    }
  } else if(actionName == 'gameaction/drop-resources') {
    const droppingResources = action.resources;
    if(!canDropResources(player, droppingResources)) {
      throw new Error(`${actor} trying to drop ${JSON.stringify(droppingResources)}`);
    }

  } else if(actionName == 'gameaction/pick-noble') {
    const { noble } = action;
    if(!canTakeNoble(player, noble)) {
      throw new Error(`${actor} can't take noble: ${noble.key}`);
    }

  } else {
    throw new Error(`Unknown action by ${actor}: ${actionName}`);
  }
}
