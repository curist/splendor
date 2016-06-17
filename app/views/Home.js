import m from 'mithril';

import Counter from 'app/widgets/Counter';
import Clickers from 'app/widgets/Clickers';

import './home.css';

const Home = {
  view (ctrl) {
    return m('div.Home', [
      m('.Clickers', m(Clickers)),
      m('.Content', m(Counter)),
    ]);
  }
}

export default Home;
