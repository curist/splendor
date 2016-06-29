import B from 'app/broker';
import db from 'app/db';
import _ from 'underscore';

const debug = require('debug')('app/actions/game');

import {initActors} from 'app/AI/actors';

import setting from 'app/data/game-setting';
import {colors} from 'app/data/game-setting';
import cards from 'app/data/cards';
import nobleData from 'app/data/nobles';

const nobles = nobleData.map((noble, i) => {
  noble.key = i;
  return noble;
});

// card statuses:
//   - deck
//   - board
//   - hold
//   - bought
const groupedCards = _(cards.map((card, i) => {
  card.key = i;
  card.status = 'deck';
  return card;
})).groupBy(card => card.rank);

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function changeCardStatus(status) {
  return (ocard) => {
    let card = clone(ocard);
    card.status = status;
    return card;
  };
}

B.on('game/init', (action) => {
  const { players, winGameScore, mode, rounds } = action;

  const playerCount = players.length;

  initActors(players);

  db.set(['game', 'mode'], mode);

  if(mode == 'tourment' && !db.get(['tourment', 'currentRound'])) {
    db.set('tourment', {
      players,
      winGameScore,
      rounds,
      currentRound: 0,
      wins: players.map(player => {
        return 0;
      }),
      turns: [],
    });
  }
  const currentRound = db.get(['tourment', 'currentRound']);
  db.set(['tourment', 'currentRound'], currentRound + 1);

  db.set(['game', 'turn'], 1);
  db.set(['game', 'win-game-score'], winGameScore);

  const {
    1: rank1cards,
    2: rank2cards,
    3: rank3cards,
  } = groupedCards;

  let rank1deck = _.shuffle(rank1cards);
  let rank2deck = _.shuffle(rank2cards);
  let rank3deck = _.shuffle(rank3cards);

  db.set(['game', 'cards1'],
    _(rank1deck).take(4).map(changeCardStatus('board')));
  db.set(['game', 'cards2'],
    _(rank2deck).take(4).map(changeCardStatus('board')));
  db.set(['game', 'cards3'],
    _(rank3deck).take(4).map(changeCardStatus('board')));

  db.set(['game', 'deck1'], _(rank1deck).drop(4));
  db.set(['game', 'deck2'], _(rank2deck).drop(4));
  db.set(['game', 'deck3'], _(rank3deck).drop(4));

  db.set(['game', 'resource', 'gold'], 5);

  colors.forEach(color => {
    db.set(['game', 'resource', color], setting[playerCount].resource);
  });

  db.set(['game', 'nobles'], _(nobles).chain()
    .shuffle().take(setting[playerCount].nobles).value());


  // TODO randomize or by setting
  db.set(['game', 'current-player'], 0);

  db.set(['game', 'players'], players.map((actor, i) => {
    return {
      key: i,
      actor: actor,
      bonus: {
        white: 0,
        blue: 0,
        green: 0,
        red: 0,
        black: 0,
      },
      resources: {
        white: 0,
        blue: 0,
        green: 0,
        red: 0,
        black: 0,
        gold: 0,
      },
      score: 0,
      reservedCards: [],
    };
  }));

  requestAnimationFrame(() => {
    B.do({ action: 'gameevent/turn' });
  });
});

B.on('game/exit', (action) => {
  db.unset(['game']);
  db.unset(['tourment']);
});

