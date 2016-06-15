import m from 'mithril';
import B from 'app/broker';

import { BindData } from 'app/utils';

import Button from 'app/widgets/Button';

import './userStatus.css';

const UserStatus = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      user: ['user']
    })

    ctrl.signin = () => {
      B.do({
        action: 'signin'
      });
    }
    ctrl.signout = () => {
      B.do({
        action: 'signout'
      });
    }
  },
  view (ctrl) {
    return m('div.UserStatus', [
      (function() {
        const user = ctrl.data.user;
        if(!user) {
          return [
            m('span.status', 'not login'),
            m(Button, {
              config: {
                ripple: true,
                raised: true,
                accent: true,
              },
              onclick: ctrl.signin
            }, 'sign in'),
          ]
        }
        return [
          m('.user-name', user.name),
          m('img.user-avatar', {
            src: user.photoUrl
          }),
          m(Button, {
            config: {
              ripple: true,
              raised: true,
              accent: true,
            },
            onclick: ctrl.signout
          }, 'sign out'),
        ]
      })()
    ]);
  }
}

export default UserStatus;
