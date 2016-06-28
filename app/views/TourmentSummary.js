import m from 'mithril';
import _ from 'underscore';

import B from 'app/broker';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/utils';

import './tourmentsummary.css';

const Summary = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      players: ['game', 'players'],
      wins: ['tourment', 'wins'],
    });

    ctrl.exitGame = () => {
      B.do({
        action: 'game/exit',
      });
    };
  },
  view (ctrl) {
    const players = ctrl.data.players;
    const wins = ctrl.data.wins;
    return m('.SummaryBackdrop', m('.Summary.col', [
      m('h1', 'Tourment G_G'),
      players.map((player, i) => {
        return m('.Player', [
          m('.row', [
            m('strong', i + 1 + '.'),
            m('span', player.actor),
          ]),
          m('.Score', [
            m('strong', wins[i]),
            ' wins'
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
