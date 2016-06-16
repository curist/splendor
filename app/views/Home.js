import m from 'mithril';
import B from 'app/broker';

import UserStatus from 'app/views/UserStatus';
import Counter from 'app/widgets/Counter';
import Clickers from 'app/widgets/Clickers';

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
      m('.Clickers', m(Clickers)),
      m('.Content', m(Counter)),
    ]);
  }
}

export default Home;
