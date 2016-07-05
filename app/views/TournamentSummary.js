import m from 'mithril';
import _ from 'underscore';

import B from 'app/broker';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/db';

import './tournamentsummary.css';

const Summary = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      players: ['game', 'players'],
      wins: ['tournament', 'wins'],
      turns: ['tournament', 'turns'],
    });

    ctrl.exitGame = () => {
      B.do({
        action: 'game/exit',
      });
    };

    ctrl.sum = (arr) => {
      return arr.reduce((total, n) => {
        return total + n;
      }, 0);
    };

    ctrl.average = (arr) => {
      return (ctrl.sum(arr) / arr.length).toFixed(1);
    };
  },
  view (ctrl) {
    const players = ctrl.data.players;
    const wins = ctrl.data.wins;
    const avgTurns = ctrl.average(ctrl.data.turns);
    return m('.SummaryBackdrop', m('.Summary.col', [
      m('h1', 'Tournament G_G'),
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
      m('p', `avg turns: ${avgTurns}`),
      m('button', {
        onclick: ctrl.exitGame.bind(ctrl),
      }, 'ok')
    ]));
  },
};

export default Summary;
