import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';


const NewGameSetting = {
  controller () {
    const ctrl = this;

    ctrl.players = m.prop(2);
    ctrl.initGame = () => {
      B.do({
        action: 'game/init',
        players: ctrl.players(),
      });
    };
  },
  view (ctrl) {
    return m('view', m('.col', [
      m('select', {
        value: ctrl.players(),
        onchange: m.withAttr('value', ctrl.players),
      },_.range(2,5).map(n => {
        return m('option', {
          value: n
        }, n);
      })),
      m('button', {
        onclick: ctrl.initGame.bind(ctrl),
      }, 'Init Game'),
    ]));
  },
};

export default NewGameSetting;
