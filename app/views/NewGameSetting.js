import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import AIs from 'app/AI';

const debug = require('debug')('app/views/NewGameSetting');

const NewGameSetting = {
  controller () {
    const ctrl = this;

    ctrl.players = m.prop(2);
    ctrl.playerActors = m.prop([
      'human',
      'human',
    ]);

    ctrl.score = m.prop(15);

    ctrl.actors = ['human'].concat(Object.keys(AIs).map(name => {
      return `ai:${name}`;
    }));

    ctrl.initGame = () => {
      B.do({
        action: 'game/init',
        players: ctrl.playerActors(),
        winGameScore: ctrl.score(),
      });
    };

    ctrl.changePlayerCount = (n) => {
      let actors = ctrl.playerActors().concat(['human', 'human', 'human']);
      ctrl.playerActors(actors.slice(0, n));
      ctrl.players(n);
    };

    ctrl.changePlayerSetting = (n, entity) => {
      let playerActors = ctrl.playerActors();
      playerActors[n] = entity;
      ctrl.playerActors(playerActors);
    };
  },
  view (ctrl) {
    return m('.NewGameSetting', m('.col', [
      m('.row', [
        'players: ',
        m('select', {
          key: 'players',
          value: ctrl.players(),
          onchange: m.withAttr('value', ctrl.changePlayerCount.bind(ctrl)),
        },_.range(1,5).map(n => {
          return m('option', {
            value: n
          }, n);
        })),
      ]),
      _.range(1, parseInt(ctrl.players()) + 1).map(n => {
        return m('.row', {
          key: `actor${n}.row`
        }, [
          m('.PlayerSetting', `player ${n}:`),
          m('select', {
            value: ctrl.playerActors()[n-1],
            onchange: m.withAttr('value', ctrl.changePlayerSetting.bind(ctrl, n-1)),
          }, ctrl.actors.map(player => {
            return m('option', {
              value: player
            }, player);
          })),
        ]);
      }),
      m('.row', {
        key: 'win-game-row'
      }, [
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
