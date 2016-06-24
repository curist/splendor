import m from 'mithril';
import _ from 'underscore';

import B from 'app/broker';

import { colors } from 'app/data/game-setting';

const debug = require('debug')('app/widgets/Card');

import './card.css';

// args schema:
//   { rank: 1,
//     white: 0,
//     blue: 3,
//     green: 0,
//     red: 0,
//     black: 0,
//     points: 0,
//     provides: 'black',
//     total_cost: 3 }
const Card = {
  controller () {
    const ctrl = this;
    ctrl.onClick = (card) => {
      B.do({
        action: 'gameaction/pick-card',
        card: card,
      });
    };
  },
  view (ctrl, card) {
    if(card.status == 'empty') {
      return m('.Card');
    }
    return m('.Card', {
      onclick: ctrl.onClick.bind(ctrl, card)
    }, [
      (function() {
        if(card.points > 0) {
          return m('.Points', card.points);
        }
      })(),
      m('.Provide.' + card.provides),
      m('.Cost', colors.filter(color => {
        return (card[color] > 0);
      }).map(color => {
        return m('.Row', [
          m('.Indicator.' + color),
          m('.Count', card[color]),
        ]);
      })),
      m('.Rank', 'r' + card.rank),
    ]);
  }
};

export default Card;
