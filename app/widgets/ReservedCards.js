import m from 'mithril';

import Card from 'app/widgets/Card';

import './reservedcards.css';

const ReservedCards = {
  view (ctrl, player) {
    const cards = player.reservedCards;
    const hide = (cards.length == 0) ? '.hide' : '';
    return m('.ReservedCards' + hide, [
      m('.Title', 'Hold: ' + cards.length),
      m('.CardContainer', cards.map(card => {
        return m(Card, card);
      })),
    ]);
  }
};

export default ReservedCards;
