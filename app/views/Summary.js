import m from 'mithril';
import _ from 'underscore';

import B from 'app/broker';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/db';

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
    const players = ctrl.data.players;
    return m('.SummaryBackdrop', m('.Summary.col', [
      m('h1', 'G_G'),
      players.map((player, i) => {
        return m('.Player', [
          m('.row', [
            m('strong', i + 1 + '.'),
            m('span', player.actor),
          ]),
          m('.Score', [
            m('strong', player.score),
            ' pts'
          ]),
        ]);
      }),
      m('button', {
        onclick: ctrl.exitGame.bind(ctrl),
      }, 'ok')
    ]));
  },
};

export default Summary;
