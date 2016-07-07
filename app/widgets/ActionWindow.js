// showing current player action status,
// for confirmation and or futher actions

import m from 'mithril';
import B from 'app/broker';

import Card from 'app/widgets/Card';
import Noble from 'app/widgets/Noble';

import { colors } from 'app/data/game-setting';
import { BindData } from 'app/db';

import './actionwindow.css';

const debug = require('debug')('app/widgets/ActionWindow');

const ActionWindow = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      action: ['game', 'action'],
      takenResources: ['game', 'action', 'resources'],
      resources: ['game', 'resources'],
    });

    const action = ctrl.data.action;

    ctrl.takeResource = (color) => {
      let res = Object.assign({}, ctrl.data.takenResources);
      res[color] = (res[color] || 0) + 1;
      B.do({
        action: 'gameaction/take-resource',
        resources: res,
      });
    };

    ctrl.giveBackResource = (color) => {
      let res = Object.assign({}, ctrl.data.takenResources);
      res[color] -= 1;
      if(res[color] == 0) {
        delete res[color];
      }
      B.do({
        action: 'gameaction/take-resource',
        resources: res,
      });
    };

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

    ctrl.pickedNoble = m.prop(0);

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

    ctrl.takeResources = (res) => {
      B.do({
        action: 'gameaction/take-resources',
        resources: res,
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

    ctrl.pickNoble = (noble) => {
      B.do({
        action: 'gameaction/pick-noble',
        noble: noble
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
      m(Card, Object.assign({}, card, {affordable: false})),
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
    const resources = ctrl.data.resources;
    const takenResources = ctrl.data.takenResources;
    const totalTaken = Object.keys(takenResources).reduce((sum, color) => {
      return sum + takenResources[color];
    }, 0);
    const took2sameColor = Object.keys(takenResources).reduce((yn, color) => {
      return yn || (takenResources[color] >= 2);
    }, false);
    return m('.ActionWindow.col', [
      m('.text', 'Resources: '),
      m('.Resources.row', colors.filter(color => {
        return resources[color];
      }).map(color => {
        const count = resources[color] - (takenResources[color] || 0);
        if(count <= 0) {
          return;
        }
        let valid = true;
        if(totalTaken >= 3) {
          valid = false;
        } else if(took2sameColor) {
          valid = false;
        } else if(takenResources[color] > 0 &&
          (totalTaken > 1 || resources[color] < 4)) {
          valid = false;
        }
        if(!valid) {
          return m('.Resource.invalid.' + color, count);
        }
        return m('.Resource.' + color, {
          onclick: ctrl.takeResource.bind(ctrl, color),
        }, count);
      })),
      m('.text', 'Take'),
      m('.Resources.row', Object.keys(takenResources).map(color => {
        const count = (takenResources[color] || 0);
        return m('.Resource.' + color, {
          onclick: ctrl.giveBackResource.bind(ctrl, color),
        }, count);
      })),
      m('button', {
        onclick: ctrl.takeResources.bind(ctrl, takenResources),
      }, 'take'),
      m('button', {
        onclick: ctrl.cancel.bind(ctrl),
      }, 'cancel'),
    ]);
  },
  blindHoldView (ctrl, rank) {
    return m('.ActionWindow.col', [
      m('p.text', `Hold a rank ${rank} card`),
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
  pickNobleView (ctrl, nobles) {
    return m('.ActionWindow.col', [
      m('.Nobles.row', nobles.map((noble, i) => {
        const picked = (ctrl.pickedNoble() == i) ? '.picked' : '';
        return m('.wrapper', {
          onclick: ctrl.pickedNoble.bind(ctrl, i)
        }, [
          m('.PickNoble' + picked, '✓'),
          m(Noble, noble),
        ]);
      })),
      m('button', {
        onclick: ctrl.pickNoble.bind(ctrl, nobles[ctrl.pickedNoble()])
      }, 'confirm'),
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
    case 'pick-a-noble':
      return m('.ActionWindowBackdrop', [
        ActionWindow.pickNobleView(ctrl, action.nobles)
      ]);
    default:
      return m('.ActionWindowBackdrop.hide');
    }
  },
};

export default ActionWindow;
