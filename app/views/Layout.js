import m from 'mithril';

import InGameMenu from 'app/views/InGameMenu';
import { BindData } from 'app/utils';

const Layout = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      user: ['user']
    });
  },
  view (ctrl, args, component) {
    const user = ctrl.data.user;
    return m('div', [
      m(InGameMenu),
      (() => {
        if(user) {
          return m(component);
        } else {
          return m('span', '^ please login first');
        }
      })()
    ]);
  }
};

export default Layout;
