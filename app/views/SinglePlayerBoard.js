import m from 'mithril';
const debug = require('debug')('app/views/PlayerBoard');

import B from 'app/broker';

import { BindData } from 'app/db';
import {colors} from 'app/data/game-setting';

import './singleplayerboard.css';

const SinglePlayerBoard = {
  controller () {
    const ctrl = this;
    ctrl.resourceTypes = colors.concat(['gold']);

    BindData(ctrl, {
      winGameScore: ['game', 'win-game-score'],
    });
  },
  view (ctrl, args) {
    const { player, turn } = args;
    return m('.SinglePlayerBoard.col', [
      m('.TurnRow.row', [
        m('strong', 'turn: '),
        m('.Turn', turn),
      ]),
      m('.ScoreRow.row', [
        m('strong', 'score: '),
        m('.Score', `${player.score} / ${ctrl.data.winGameScore}`),
      ]),
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource.col', [
          m('.Indicator.' + type, player.bonus[type] || ''),
          m('.Count', player.resources[type]),
        ]);
      })),
    ]);
  },
};

export default SinglePlayerBoard;
