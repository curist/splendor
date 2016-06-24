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

    ctrl.dropResources = m.prop({});

    ctrl.dropResource = (color) => {
      let res = ctrl.dropResources();
      res[color] = (res[color] || 0) + 1;
      ctrl.dropResources(res);
    };

    ctrl.takeBackResource = (color) => {
      let res = ctrl.dropResources();
      res[color] -= 1;
      if(res[color] == 0) {
        delete res[color];
      }
      ctrl.dropResources(res);
    };

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

    ctrl.blindHold = (rank) => {
      B.do({
        action: 'gameaction/blind-hold',
        rank: rank,
      });
    };

    ctrl.doDropResources = () => {
      B.do({
        action: 'gameaction/drop-resources',
        resources: ctrl.dropResources(),
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
  blindHoldView (ctrl, rank) {
    return m('.ActionWindow.col', [
      m('p', `Hold a rank ${rank} card`),
      m('button', {
        onclick: ctrl.blindHold.bind(ctrl, rank),
      }, 'hold'),
      m('button', {
        onclick: ctrl.cancel.bind(ctrl),
      }, 'cancel'),
    ]);
  },
  dropResourceView (ctrl, player) {
    const dropResources = ctrl.dropResources();
    const resourcesCount = Object.keys(player.resources).reduce((sum, color) => {
      return sum + (player.resources[color] - (dropResources[color] || 0));
    }, 0);
    return m('.ActionWindow', [
      'Your Resource: ' + resourcesCount,
      m('.Resources.hold.row', Object.keys(player.resources).filter(color => {
        return (player.resources[color] - (dropResources[color] || 0)) > 0;
      }).map(color => {
        return m('.Resource.' + color, {
          onclick: ctrl.dropResource.bind(ctrl, color),
        }, player.resources[color] - (dropResources[color] || 0));
      })),
      'Resource to discard',
      m('.Resources.drop.row', Object.keys(dropResources).map(color => {
        return m('.Resource.' + color, {
          onclick: ctrl.takeBackResource.bind(ctrl, color),
        }, dropResources[color]);
      })),
      (function() {
        if(resourcesCount <= 10) {
          return m('button', {
            onclick: ctrl.doDropResources.bind(ctrl),
          }, 'discard');
        }
      })(),
    ]);
  },
  view (ctrl) {
    const action = ctrl.data.action;
    if(!action) {
      return m('.ActionWindowBackdrop.hide');
    }
    switch(action.action) {
    case 'pick-card':
      return m('.ActionWindowBackdrop', [
        ActionWindow.pickCardView(ctrl, action.card),
      ]);
    case 'take-resource':
      return m('.ActionWindowBackdrop', [
        ActionWindow.takeResourceView(ctrl)
      ]);
    case 'blind-hold':
      return m('.ActionWindowBackdrop', [
        ActionWindow.blindHoldView(ctrl, action.rank)
      ]);
    case 'too-much-resources':
      return m('.ActionWindowBackdrop', [
        ActionWindow.dropResourceView(ctrl, action.player)
      ]);
    default:
      return m('.ActionWindowBackdrop.hide');
    }
  },
};

export default ActionWindow;
