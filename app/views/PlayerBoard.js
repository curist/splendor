import m from 'mithril';
const debug = require('debug')('app/views/PlayerBoard');

import B from 'app/broker';

import {colors} from 'app/data/game-setting';

import './playerboard.css';

const PlayerBoard = {
  controller () {
    const ctrl = this;
    ctrl.resourceTypes = colors.concat(['gold']);
  },
  view (ctrl, args) {
    const { isActive, player } = args;
    const active = isActive ? '.active' : '';
    // TODO show user avatar
    return m('.PlayerBoard.col' + active, [
      m('.Score', player.score),
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource', [
          m('.Indicator.' + type, player.bonus[type] || ''),
          m('.Count', player.resources[type]),
        ]);
      })),
    ]);
  },
};

export default PlayerBoard;
