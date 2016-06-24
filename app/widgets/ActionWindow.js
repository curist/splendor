// showing current player action status,
// for confirmation and or futher actions

import m from 'mithril';
import B from 'app/broker';

import Card from 'app/widgets/Card';

import { colors } from 'app/data/game-setting';
import { BindData } from 'app/utils';

import './actionwindow.css';

const debug = require('debug')('app/widgets/ActionWindow');

const ActionWindow = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      action: ['game', 'action']
    });

    ctrl.acquire = (card) => {
      B.do({
        action: 'gameaction/acquire-card',
        card: card,
      });
    };

    ctrl.reserve = (card) => {
      B.do({
        action: 'gameaction/reserve-card',
        card: card,
      });
    };

    ctrl.takeResources = () => {
      B.do({
        action: 'gameaction/take-resources',
      });
    };

    ctrl.cancel = () => {
      B.do({
        action: 'gameaction/cancel',
      });
    };
  },
  pickCardView (ctrl, card) {
    return m('.ActionWindow.row', [
      m(Card, card),
      m('.col', [
        m('button', {
          onclick: ctrl.acquire.bind(ctrl, card),
        }, 'buy'),
        (function () {
          if(card.status == 'board') {
            return m('button', {
              onclick: ctrl.reserve.bind(ctrl, card),
            }, 'hold');
          }
        })(),
        m('button', {
          onclick: ctrl.cancel.bind(ctrl),
        }, 'cancel'),
      ]),
    ]);
  },
  takeResourceView (ctrl) {
    const resources = ctrl.data.action.resources;
    return m('.ActionWindow.col', [
      m('.Resources.row', colors.filter(color => {
        return resources[color];
      }).map(color => {
        return m('.Resource.' + color, resources[color]);
      })),
      m('button', {
        onclick: ctrl.takeResources.bind(ctrl),
      }, 'take'),
      m('button', {
        onclick: ctrl.cancel.bind(ctrl),
      }, 'cancel'),
    ]);
  },
  view (ctrl) {
    const action = ctrl.data.action;
    if(!action) {
      return m('.ActionWindow.hide');
    }
    if(action.action == 'pick-card') {
      return ActionWindow.pickCardView(ctrl, action.card);
    }
    return ActionWindow.takeResourceView(ctrl);
  },
};

export default ActionWindow;
