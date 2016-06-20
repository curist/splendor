import m from 'mithril';
import _ from 'underscore';

import { colors } from 'app/data/game-setting';

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
  view (ctrl, args) {
    return m('.Card', [
      (function() {
        if(args.points > 0) {
          return m('.Points', args.points);
        }
      })(),
      m('.Provide.' + args.provides),
      m('.Cost', colors.filter(color => {
        return (args[color] > 0);
      }).map(color => {
        return m('.Row', [
          m('.Indicator.' + color),
          m('.Count', args[color]),
        ]);
      })),
      m('.Rank', 'r' + args.rank),
    ]);
  }
};

export default Card;
