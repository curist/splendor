import m from 'mithril';

import InGameMenu from 'app/views/InGameMenu';
import { BindData } from 'app/utils';

const Layout = {
  view (ctrl, args, component) {
    return m('div', [
      m(InGameMenu),
      m(component),
    ]);
  }
};

export default Layout;
