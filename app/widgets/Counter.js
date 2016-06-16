import m from 'mithril';
import B from 'app/broker';
import { BindData } from 'app/utils';

const Counter = {
  controller () {
    let ctrl = this;

    BindData(ctrl, {
      count: ['count'],
    });

    ctrl.inc = function() {
      B.do({
        action: 'firebase/inc-count'
      });
    }
  },
  view (ctrl) {
    return m('div', [
      m('h1', 'Counter'),
      m('p', [
        'count: ',
        ctrl.data.count
      ]),
      m('button', {
        onclick: ctrl.inc.bind(ctrl),
      }, '+ 1'),
    ]);
  }
}

export default Counter;
