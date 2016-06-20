import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import './home.css';

import allCards from 'app/data/cards';
import Card from 'app/widgets/Card';
import GameBoard from 'app/views/GameBoard';

const Home = {
  controller () {
    const ctrl = this;

    ctrl.cards = [];
    ctrl.initGame = () => {
      B.do({
        action: 'game/init',
        players: 2,
      });
    };
    ctrl.deal = () => {
      ctrl.cards = _.chain(allCards).shuffle().take(12).value();
    };
  },
  view (ctrl) {
    return m('div.Home', [
      m('div.SideBar', 'Home'),
      m(GameBoard),
      m('.col', [
        m('.row', [
          m('button', {
            onclick: ctrl.initGame.bind(ctrl),
          }, 'Init Game'),
          m('button', {
            onclick: ctrl.deal.bind(ctrl),
          }, 'Deal Cards'),
        ]),
        m('.Content', ctrl.cards.map(card => {
          return m(Card, card);
        })),
      ])
    ]);
  }
};

export default Home;
