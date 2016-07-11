import m from 'mithril';
import B from 'app/broker';
const debug = require('debug')('app/views/InGameMenu');

import { BindData } from 'app/db';

import './ingamemenu.less';

const InGameMenu = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      game: ['game'],
      observer: ['game-settings', 'observer-mode'],
    });

    ctrl.signin = () => {
      B.do({
        action: 'signin'
      });
    };
    ctrl.signout = () => {
      B.do({
        action: 'signout'
      });
    };

    ctrl.undo = () => {
      B.do({ action: 'game/undo' });
    };

    ctrl.nextTurn = () => {
      B.do({ action: 'gameevent/turn' });
    };

    ctrl.exitGame = () => {
      B.do({ action: 'game/exit' });
    };
  },
  view (ctrl) {
    return m('div.InGameMenu', [
      (function () {
        if(ctrl.data.game) {
          return m('.row', [
            m('button', {
              onclick: ctrl.undo.bind(ctrl),
            }, 'undo'),
            (function() {
              if(ctrl.data.observer) {
                return m('button', {
                  onclick: ctrl.nextTurn.bind(ctrl),
                }, 'next turn');
              }
            })(),
            m('button', {
              onclick: ctrl.exitGame.bind(ctrl),
            }, 'exit game'),
          ]);
        }
      })(),
    ]);
  }
};

export default InGameMenu;
