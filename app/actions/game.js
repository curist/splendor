import B from 'app/broker';
import db from 'app/db';
import _ from 'underscore';

import DEBUG from 'debug';
const debug = DEBUG('app/actions/game');

import setting from 'app/data/game-setting';
import {colors} from 'app/data/game-setting';
import cards from 'app/data/cards';
import nobles from 'app/data/nobles';
const groupedCards = _(cards).groupBy(card => card.rank);

B.on('game/init', (action) => {
  const { players } = action;
  debug(players);

  const {
    1: rank1cards,
    2: rank2cards,
    3: rank3cards,
  } = groupedCards;

  let rank1deck = _.shuffle(rank1cards);
  let rank2deck = _.shuffle(rank2cards);
  let rank3deck = _.shuffle(rank3cards);

  db.set(['game', 'cards1'], _(rank1deck).take(4));
  db.set(['game', 'cards2'], _(rank2deck).take(4));
  db.set(['game', 'cards3'], _(rank3deck).take(4));

  db.set(['game', 'deck1'], _(rank1deck).drop(4));
  db.set(['game', 'deck2'], _(rank2deck).drop(4));
  db.set(['game', 'deck3'], _(rank3deck).drop(4));

  db.set(['game', 'resource', 'gold'], 5);

  colors.forEach(color => {
    db.set(['game', 'resource', color], setting[players].resource);
  });

  db.set(['game', 'nobles'], _(nobles).chain()
    .shuffle().take(setting[players].nobles).value());


  // TODO players status
  // TODO randomize or by setting
  db.set(['game', 'current-player'], 0);
  db.set(['game', 'players'], _.range(players).map(() => {
    return {
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
});
