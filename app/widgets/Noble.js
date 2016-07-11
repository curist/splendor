import m from 'mithril';

import { colors } from 'app/data/game-setting';

import './noble.less';

const Noble = {
  view (ctrl, args) {
    return m('.Noble', [
      m('.Points', args.points),
      m('.Cost', colors.filter(color => {
        return (args[color] > 0);
      }).map(color => {
        return m('.Indicator.' + color, args[color]);
      })),
    ]);
  },
};

export default Noble;

