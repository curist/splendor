import m from 'mithril';
import _ from 'underscore';

import B from 'app/broker';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/utils';

import './summary.css';

const Summary = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      players: ['game', 'players'],
    });

    ctrl.exitGame = () => {
      B.do({
        action: 'game/exit',
      });
    };
  },
  view (ctrl) {
    const players = _(ctrl.data.players).sortBy((playerA, playerB) => {
      const playerAbought = colors.reduce((sum, color) => {
        return sum + playerA.bonus[color];
      }, 0);
      const playerBbought = colors.reduce((sum, color) => {
        return sum + playerA.bonus[color];
      }, 0);
      return (playerA.score - playerB.score) ||
        (playerAbought - playerBbought);
    });
    return m('.SummaryBackdrop', m('.Summary.col', [
      m('h1', 'G_G'),
      players.map((player, i) => {
        return m('.row', [
          m('h3', i + 1 + '.'),
          m('h4.Score', player.score),
          ' points',
        ]);
      }),
      m('button', {
        onclick: ctrl.exitGame.bind(ctrl),
      }, 'ok')
    ]));
  },
};

export default Summary;
