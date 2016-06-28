import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

const debug = require('debug')('app/views/NewGameSetting');

// TODO import AIs here


const NewGameSetting = {
  controller () {
    const ctrl = this;

    ctrl.players = m.prop(2);
    ctrl.score = m.prop(15);

    ctrl.playerSetting = m.prop([
      'human',
      'human',
      'human',
      'human',
    ]);

    ctrl.availablePlayers = [
      'human',
      'ai:easy',
    ];

    ctrl.initGame = () => {
      B.do({
        action: 'game/init',
        players: ctrl.players(),
        winGameScore: ctrl.score(),
      });
    };

    ctrl.changePlayerSetting = (n, entity) => {
      let playerSetting = ctrl.playerSetting();
      playerSetting[n] = entity;
      ctrl.playerSetting(playerSetting);
    };
  },
  view (ctrl) {
    return m('.NewGameSetting', m('.col', [
      m('.row', [
        'players: ',
        m('select', {
          value: ctrl.players(),
          onchange: m.withAttr('value', ctrl.players),
        },_.range(1,5).map(n => {
          return m('option', {
            value: n
          }, n);
        })),
      ]),
      _.range(1, parseInt(ctrl.players()) + 1).map(n => {
        return m('.row', [
          m('.PlayerSetting', `player ${n}:`),
          m('select', {
            value: ctrl.playerSetting()[n-1],
            onchange: m.withAttr('value', ctrl.changePlayerSetting.bind(ctrl, n-1)),
          }, ctrl.availablePlayers.map(player => {
            return m('option', {
              value: player
            }, player);
          })),
        ]);
      }),
      m('.row', [
        'win game score: ',
        m('select', {
          value: ctrl.score(),
          onchange: m.withAttr('value', ctrl.score),
        }, [15, 20, 25, 30].map(n => {
          return m('option', {
            value: n
          }, n);
        })),
      ]),
      m('button', {
        onclick: ctrl.initGame.bind(ctrl),
      }, 'Start Game'),
    ]));
  },
};

export default NewGameSetting;
