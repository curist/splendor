import m from 'mithril';
import B from 'app/broker';

import UserStatus from 'app/views/UserStatus';
import Counter from 'app/views/Counter';

import { BindData } from 'app/utils';

import './home.css';

const Home = {
  controller () {
    const ctrl = this;

    BindData(ctrl , {
      user: ['user']
    })
  },
  view (ctrl) {
    const user = ctrl.data.user;
    return m('div.Home', [
      m(Counter),
    ]);
  }
}

export default Home;
