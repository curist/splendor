import m from 'mithril';
import B from 'app/broker';
const debug = require('debug')('app/views/InGameMenu');

import { BindData } from 'app/db';

import './inGameMenu.css';

const InGameMenu = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      game: ['game']
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

    ctrl.pass = () => {
      B.do({
        action: 'gameaction/take-resources',
        resources: {},
      });
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
            m('button', {
              onclick: ctrl.pass.bind(ctrl),
            }, 'pass'),
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
