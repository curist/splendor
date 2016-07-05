import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import { BindData } from 'app/db';

import AIs from 'app/AI';

import './newgamesetting.css';

const debug = require('debug')('app/views/NewGameSetting');

const NewGameSetting = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      playerActors: ['game-settings', 'player-actors'],
      score: ['game-settings', 'win-game-score'],
      rounds: ['game-settings', 'tourment-rounds'],
      seed: ['game-settings', 'random-seed'],
      fast: ['game-settings', 'fast-mode'],
    });

    const playerActors = (ctrl.data.playerActors || ['human', 'human']).slice(0,4);

    ctrl.players = m.prop(playerActors.length);
    ctrl.playerActors = m.prop(playerActors);
    ctrl.score = m.prop(ctrl.data.score || 15);
    ctrl.tourmentRounds = m.prop(ctrl.data.rounds || 5);
    ctrl.seed = m.prop(ctrl.data.seed || '');
    ctrl.fast = m.prop(ctrl.data.fast);

    ctrl.actors = ['human'].concat(Object.keys(AIs).map(name => {
      return `ai:${name}`;
    }));

    ctrl.initGame = (mode) => {
      B.do({
        action: 'game/init',
        mode: mode,
        players: ctrl.playerActors(),
        winGameScore: ctrl.score(),
        rounds: ctrl.tourmentRounds() || 3,
        fast: ctrl.fast(),
        seed: ctrl.seed() || undefined
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
      m('h4', 'Genral Settings'),
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
      m('h4', 'Tourment Settings'),
      m('.row', [
        m('span', 'tourment rounds: '),
        m('input.rounds[type=number]', {
          value: ctrl.tourmentRounds(),
          oninput: m.withAttr('value', ctrl.tourmentRounds),
        }),
      ]),
      m('.row', [
        m('span', 'random seed:'),
        m('input.seed[type=text]', {
          value: ctrl.seed(),
          oninput: m.withAttr('value', ctrl.seed),
        }),
      ]),
      m('.row', [
        m('span', 'fast mode:'),
        m('input.fast-check[type=checkbox]', {
          checked: ctrl.fast(),
          onchange: m.withAttr('checked', ctrl.fast)
        }),
      ]),
      m('hr'),
      m('.row', {
        style: {
          'justify-content': 'center'
        }
      }, [
        m('button', {
          onclick: ctrl.initGame.bind(ctrl, 'normal'),
        }, 'Start Game'),
        m('button', {
          onclick: ctrl.initGame.bind(ctrl, 'tourment'),
        }, 'Start Tourment'),
      ]),
    ]));
  },
};

export default NewGameSetting;
