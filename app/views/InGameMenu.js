import m from 'mithril';
import B from 'app/broker';
import DEBUG from 'debug';
const debug = DEBUG('app/views/InGameMenu');

import { BindData } from 'app/utils';

import './inGameMenu.css';

const InGameMenu = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      user: ['user']
    });

    ctrl.expanded = m.prop(false);

    ctrl.toggleExpand = () => {
      debug(ctrl.expanded());
      ctrl.expanded(!ctrl.expanded());
    };

    ctrl.signin = () => {
      B.do({
        action: 'signin'
      });
    };
    ctrl.signout = () => {
      B.do({
        action: 'signout'
      });
      ctrl.toggleExpand();
    };

    ctrl.exitGame = () => {
      B.do({
        action: 'game/exit',
      });
      ctrl.toggleExpand();
    };
  },
  view (ctrl) {
    const expanded = ctrl.expanded() ? '.expanded' : '';
    return m('div.InGameMenu', [
      (function() {
        const user = ctrl.data.user;
        if(!user) {
          return [
            m('span.status', 'not login'),
            m('button', {
              onclick: ctrl.signin
            }, 'sign in'),
          ];
        }
        return [
          m('img.user-avatar', {
            src: user.photoUrl,
            onclick: ctrl.toggleExpand.bind(ctrl),
          }),
          m('.scroll' + expanded, [
            m('.user-name', user.name),
            m('button', {
              onclick: ctrl.exitGame.bind(ctrl),
            }, 'exit game'),
            m('button', {
              onclick: ctrl.signout.bind(ctrl),
            }, 'sign out'),
          ]),
        ];
      })()
    ]);
  }
};

export default InGameMenu;
