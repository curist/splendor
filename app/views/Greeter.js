import m from 'mithril';
import B from 'app/broker';
import { BindData } from 'app/utils';

const Greeter = {
  controller: function() {
    var ctrl = this;
    BindData(ctrl, {
      name: ['state', 'user']
    })

    ctrl.init = function(el, inited) {
      if(inited) {
        return;
      }
      el.value = ctrl.data.name || '';
    }

    ctrl.nameUpdated = function(e) {
      B.do({
        action: 'change-name',
        name: e.target.value,
      })
    }
  },
  view: function(ctrl) {
    return m('div', [
      m('p', [
        'Hello, ',
        ctrl.data.name,
      ]),
      m('input', {
        placeholder: 'your name',
        onkeyup: ctrl.nameUpdated,
        config: ctrl.init,
      })
    ])
  }
}

export default Greeter;
