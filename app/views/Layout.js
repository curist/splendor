import m from 'mithril';

import UserStatus from 'app/views/UserStatus';
import { BindData } from 'app/utils';

const Layout = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      user: ['user']
    })
  },
  view (ctrl, args, component) {
    const user = ctrl.data.user;
    return m('div', [
      m(UserStatus),
      (() => {
        if(user) {
          return m(component);
        } else {
          return m('span', '^ please login first')
        }
      })()
    ]);
  }
}

export default Layout;
