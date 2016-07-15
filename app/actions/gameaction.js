import B from 'app/broker';
import db from 'app/db';

import {colors} from 'app/data/game-setting';
import {
  canBuyCard,
  canTakeResources,
  canTakeNoble,
  shouldDropResources,
} from 'app/validates';

const debug = require('debug')('app/actions/gameaction');

// XXX
// action flows
// 1. player can either
//    a. acquire a card
//    b. reserve a card
//    c. take 3 different resources
//    d. take 2 of same kind of resources, if it's has 4 or more
//    ps. if player actually take a card,
//          remove it from play, and put 1 new card in
// 2. check if you player board have enough bonus card
//    to acquire nobles
// 3. clean actions, pass to next player

B.on('gameaction/pick-card', (action) => {
  db.set(['game', 'action'], {
    action: 'pick-card',
    card: action.card,
  });
});

B.on('gameaction/take-resource', (action) => {
  const resources = db.get(['game', 'resources']);
  if(!canTakeResources(resources, action.resources)) {
    return;
  }
  db.set(['game', 'action'], {
    action: 'take-resource',
    resources: action.resources,
  });
});

B.on('gameaction/take-resources', (action) => {
  // db.apply(['game', 'action', 'resources', type], (n) => {
  //   return (n || 0) + 1;
  // });
  const playerIndex = db.get(['game', 'current-player']);
  const { resources } = action;
  Object.keys(resources).forEach(type => {
    let count = resources[type];
    db.apply(['game', 'resources', type], plus(-1 * count));
    db.apply(['game', 'players', playerIndex, 'resources', type], plus(count));
  });
  endTurn(db);
});

B.on('gameaction/hold-a-rank-card', (action) => {
  db.set(['game', 'action'], {
    action: 'blind-hold',
    rank: action.rank,
  });
});

B.on('gameaction/blind-hold', (action) => {
  const { rank } = action;
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  const nextCard = db.get(['game', 'deck' + rank, 0]);
  const gold = db.get(['game', 'resources', 'gold']);

  db.shift(['game', 'deck' + rank]);

  let card = clone(nextCard);
  card.status = 'hold';

  if(gold > 0) {
    db.set(['game', 'resources', 'gold'], gold - 1);
  }
  db.apply(['game', 'players', playerIndex], (oplayer) => {
    const player = clone(oplayer);
    if(gold > 0) {
      player.resources.gold += 1;
    }
    player.reservedCards.push(card);
    return player;
  });
  endTurn(db);
});

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function plus(n) {
  return (num) => {
    return n + (num || 0);
  };
}

function cleanAction(db) {
  db.unset(['game', 'action']);
}

function endTurn(db) {
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);

  if(shouldDropResources(player)) {
    db.set(['game', 'action'], {
      action: 'too-much-resources',
      player
    });
    B.do({ action: 'gameevent/drop-resource' });
    return;
  }
  // nobles check
  const affordableNobles = db.get(['game', 'nobles']).filter(noble => {
    return canTakeNoble(player, noble);
  });
  if(affordableNobles.length > 0) {
    db.set(['game', 'action'], {
      action: 'pick-a-noble',
      nobles: affordableNobles,
    });
    B.do({
      action: 'gameevent/pick-noble',
      nobles: affordableNobles,
    });
    return;
  }
  cleanAction(db);
  nextPlayer(db);
}

// replenish card to it's original index
function takeCardAndReplenish(db, card) {
  const rank = card.rank;
  const cards = db.get(['game', 'cards' + rank]);
  let index = -1;
  for(let i = 0; i < cards.length; i ++) {
    if(cards[i].key == card.key) {
      index = i;
      break;
    }
  }
  if(index < 0) {
    return;
  }
  const nextCard = db.get(['game', 'deck' + rank, 0]);
  if(nextCard) {
    db.set(['game', 'cards' + rank, index], nextCard);
    db.set(['game', 'cards' + rank, index, 'status'], 'board');
  } else {
    db.set(['game', 'cards' + rank, index], {
      status: 'empty'
    });
  }
  db.shift(['game', 'deck' + rank]);
}

function buyReservedCard(db, card) {
  const playerIndex = db.get(['game', 'current-player']);
  db.apply(['game', 'players', playerIndex, 'reservedCards'], (reservedCards) => {
    return reservedCards.filter(reservedCard => {
      return reservedCard.key !== card.key;
    });
  });
}

function bonusCount(bonus) {
  return colors.reduce((total, color) => {
    return total + bonus[color];
  }, 0);
}

function getWinningPlayer(db) {
  const players = db.get(['game', 'players']);
  const winGameScore = db.get(['game', 'win-game-score']);
  const winningPlayer = players.filter(player => {
    return player.score >= winGameScore;
  }).sort((player1, player2) => {
    if(player1.score !== player2.score) {
      return player2.score - player1.score;
    }
    return bonusCount(player2) - bonusCount(player1);
  })[0];
  return (winningPlayer || {key: -1}).key;
}

function nextGame(db) {
  const players = db.get(['game-settings', 'player-actors']);
  const winGameScore = db.get(['game-settings', 'win-game-score']);
  const seed = db.get(['game-settings', 'random-seed']);
  const fast = db.get(['game-settings', 'fast-mode']);
  const tournament = db.get('tournament');
  const observer = db.get(['game-settings', 'observer-mode']);

  B.do({
    action: 'game/init',
    mode: 'tournament',
    seed,
    fast,
    observer,
    players,
    winGameScore,
    rounds: tournament.rounds,
  });
}

function nextPlayer(db) {
  const playerIndex = db.get(['game', 'current-player']);
  const players = db.get(['game', 'players']);
  const nextPlayer = (playerIndex + 1) % players.length;

  if(nextPlayer == 0) {
    let currentRound = db.get(['tournament', 'currentRound']);
    let totalRounds = db.get(['tournament', 'rounds']);

    const winningPlayerKey = getWinningPlayer(db);
    if(winningPlayerKey >= 0) {
      const gameMode = db.get(['game', 'mode']);
      if(gameMode == 'tournament') {
        const turn = db.get(['game', 'turn']);
        db.push(['tournament', 'turns'], turn);
        db.push(['tournament', 'winners'], winningPlayerKey );
        db.apply(['tournament', 'wins', winningPlayerKey], plus(1));
      }

      if(currentRound < totalRounds) {
        nextGame(db);
      } else {
        db.set(['game', 'show-summary'], true);
      }
      return;
    }

    db.apply(['game', 'turn'], plus(1));
  }
  db.set(['game', 'current-player'], nextPlayer);

  if(db.get(['game-settings', 'observer-mode'])) {
    return;
  }

  B.do({ action: 'gameevent/turn' });
}

// returning `player` after pay for the card
function playerAcquireCard(oplayer, card) {
  let pay = {};
  const player = clone(oplayer);
  let short = 0;
  colors.forEach(color => {
    const cost = card[color] - player.bonus[color];
    if(cost > 0) {
      if(player.resources[color] >= cost) {
        player.resources[color] -= cost;
        pay[color] = cost;
      } else {
        short += (cost - player.resources[color]);
        pay[color] = player.resources[color];
        player.resources[color] = 0;
      }
    }
  });
  pay.gold = short;
  player.resources.gold -= short;
  player.score += card.points;
  player.bonus[card.provides] += 1;
  return [ pay, player ];
}

B.on('gameaction/acquire-card', (action) => {
  const { card } = action;
  const playerIndex = db.get(['game', 'current-player']);
  const player = db.get(['game', 'players', playerIndex]);
  if(!canBuyCard(player, action.card)) {
    debug('not enough resource for the card');
    return;
  }
  const [ pay, playerPayed ] = playerAcquireCard(player, card);
  db.set(['game', 'players', playerIndex], playerPayed);
  Object.keys(pay).forEach(type => {
    db.apply(['game', 'resources', type], plus(pay[type]));
  });

  if(card.status == 'hold') {
    buyReservedCard(db, card);
  } else {
    takeCardAndReplenish(db, card);
  }
  endTurn(db);
});

B.on('gameaction/reserve-card', (action) => {
  const { card: ocard } = action;
  const playerIndex = db.get(['game', 'current-player']);
  const gold = db.get(['game', 'resources', 'gold']);

  let card = clone(ocard);
  card.status = 'hold';

  if(gold > 0) {
    db.set(['game', 'resources', 'gold'], gold - 1);
  }
  db.apply(['game', 'players', playerIndex], (oplayer) => {
    const player = clone(oplayer);
    if(gold > 0) {
      player.resources.gold += 1;
    }
    player.reservedCards.push(card);
    return player;
  });
  takeCardAndReplenish(db, card);
  endTurn(db);
});

B.on('gameaction/cancel', () => {
  cleanAction(db);
});

B.on('gameaction/drop-resources', (action) => {
  const playerIndex = db.get(['game', 'current-player']);
  const { resources: dropResources } = action;
  Object.keys(dropResources).forEach(color => {
    const count = dropResources[color];
    db.apply(['game', 'players', playerIndex, 'resources', color], plus(-1 * count));
    db.apply(['game', 'resources', color], plus(count));
  });
  endTurn(db);
});

B.on('gameaction/pick-noble', (action) => {
  const { noble } = action;
  db.apply(['game', 'nobles'], (nobles) => {
    return nobles.filter(nbl => {
      return nbl.key !== noble.key;
    });
  });
  const playerIndex = db.get(['game', 'current-player']);
  db.apply(['game', 'players', playerIndex, 'score'], plus(noble.points));
  cleanAction(db);
  nextPlayer(db);
});
