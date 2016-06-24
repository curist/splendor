import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';


const NewGameSetting = {
  controller () {
    const ctrl = this;

    ctrl.players = m.prop(2);
    ctrl.score = m.prop(15);

    ctrl.initGame = () => {
      B.do({
        action: 'game/init',
        players: ctrl.players(),
        winGameScore: ctrl.score(),
      });
    };
  },
  view (ctrl) {
    return m('view', m('.col', [
      m('.row', [
        'players: ',
        m('select', {
          value: ctrl.players(),
          onchange: m.withAttr('value', ctrl.players),
        },_.range(2,5).map(n => {
          return m('option', {
            value: n
          }, n);
        })),
      ]),
      m('.row', [
        'win game score: ',
        m('select', {
          value: ctrl.score(),
          onchange: m.withAttr('value', ctrl.score),
        }, [15, 18, 20, 25, 30].map(n => {
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
