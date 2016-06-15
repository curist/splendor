import m from 'mithril';
import B from 'app/broker';

import UserStatus from 'app/views/UserStatus';
import Counter from 'app/views/Counter';

import './home.css';

const Home = {
  controller () {
    const ctrl = this;
  },
  view (ctrl) {
    return m('div.Home', [
      m(UserStatus),
      m('h1', 'Home'),
      m(Counter),
    ]);
  }
}

export default Home;
