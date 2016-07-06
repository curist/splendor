import m from 'mithril';

import Card from 'app/widgets/Card';

import { canBuyCard } from 'app/validates';

import './reservedcards.css';

const debug = require('debug')('app/widgets/ReservedCards');

const ReservedCards = {
  view (ctrl, player) {
    const cards = player.reservedCards;
    const hide = (cards.length == 0) ? '.hide' : '';
    return m('.ReservedCards' + hide, [
      m('.Title', 'Hold: ' + cards.length),
      m('.CardContainer', cards.map(card => {
        const affordable = canBuyCard(player, card);
        return m(Card, Object.assign({}, card, { affordable }));
      })),
    ]);
  }
};

export default ReservedCards;
