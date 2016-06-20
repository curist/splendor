import m from 'mithril';
import _ from 'underscore';

import './home.css';

import allCards from 'app/cards';
import Card from 'app/widgets/Card';

const Home = {
  view (/* ctrl */) {
    const cards = _.chain(allCards).shuffle().take(10).value();
    return m('div.Home', [
      m('div.SideBar', 'Home'),
      m('.Content', cards.map(card => {
        return m(Card, card);
      }))
    ]);
  }
};

export default Home;
