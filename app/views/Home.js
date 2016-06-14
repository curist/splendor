import m from 'mithril';

import Greeter from 'app/views/Greeter';
import Counter from 'app/views/Counter';

import './home.css';

const Home = {
  controller: function() {
  },
  view: function(ctrl) {
    return m('div.Home', [
      m('h1', 'Home'),
      m(Greeter),
      m(Counter),
    ]);
  }
}

export default Home;
