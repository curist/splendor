import m from 'mithril';

import {colors} from 'app/data/game-setting';

import './playerboard.css';

const PlayerBoard = {
  controller () {
    const ctrl = this;
    ctrl.resourceTypes = colors.concat(['gold']);
  },
  view (ctrl, args) {
    const player = args.player;
    return m('.PlayerBoard', [
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource', [
          m('.Indicator.' + type, player.bonus[type] || ''),
          m('.Count', player.resources[type]),
        ]);
      })),
      m('.Score', [
        m('.Title', 'Score: '),
        // TODO show player reserved cards
        m('.Points', player.score),
      ]),
    ]);
  },
};

export default PlayerBoard;
