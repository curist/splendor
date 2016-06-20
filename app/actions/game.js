import B from 'app/broker';
import db from 'app/db';
import _ from 'underscore';

import DEBUG from 'debug';
const debug = DEBUG('app/actions/game');

import cards from 'app/data/cards';
const groupedCards = _(cards).groupBy(card => card.rank);

B.on('game/init', () => {
  const {
    1: rank1cards,
    2: rank2cards,
    3: rank3cards,
  } = groupedCards;
  debug(rank1cards);
});
