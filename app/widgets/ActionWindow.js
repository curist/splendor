// showing current player action status,
// for confirmation and or futher actions

import m from 'mithril';
import B from 'app/broker';

import Card from 'app/widgets/Card';

import { BindData } from 'app/utils';

import './actionwindow.css';

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
        }, 'acquire'),
        m('button', {
          onclick: ctrl.reserve.bind(ctrl, card),
        }, 'reserve'),
        m('button', {
          onclick: ctrl.cancel.bind(ctrl),
        }, 'cancel'),
      ]),
    ]);
  },
  takeResourceView (ctrl) {

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
