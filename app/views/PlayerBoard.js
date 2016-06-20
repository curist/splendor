import m from 'mithril';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/utils';

import './playerboard.css';

const PlayerBoard = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      player: ['game', 'players', 0],
    });

    ctrl.resourceTypes = colors.concat(['gold']);

  },
  view (ctrl) {
    return m('.PlayerBoard', [
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource', [
          m('.Indicator.' + type, ctrl.data.player.bonus[type] || ''),
          m('.Count', ctrl.data.player.resources[type]),
        ]);
      })),
      m('.Score', [
        m('.Title', 'Score: '),
        m('.Points', ctrl.data.player.score),
      ]),
    ]);
  },
};

export default PlayerBoard;
