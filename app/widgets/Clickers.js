import m from 'mithril';
import firebase from 'app/firebase';

import { BindData } from 'app/utils';

import './clickers.css';

const Counter = {
  controller () {
    let ctrl = this;

    BindData(ctrl, {
      user: ['user'],
      clickers: ['clickers'],
    });

    ctrl.leave = () => {
      firebase.leaveGame();
    }
  },
  view (ctrl) {
    const user = ctrl.data.user || {};
    return m('div', [
      m('h1', 'clickers'),
      (ctrl.data.clickers || []).map(clicker => {
        return m('.Clicker', [
          m('img.Photo', {
            src: clicker.photoUrl
          }),
          m('div', [
            m('div.Name', clicker.username),
            (function() {
              if(clicker.uid == user.uid) {
                return m('div.Info', [
                  m('div', "(It's you!)"),
                  m('div.Leave', {
                    onclick: ctrl.leave,
                  }, 'leave'),
                ])
              }
            })(),
          ]),
        ])
      }),
    ]);
  }
}

export default Counter;
