import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import { BindData } from 'app/utils';

import './home.css';

import allCards from 'app/data/cards';
import Card from 'app/widgets/Card';
import NewGameSetting from 'app/views/NewGameSetting';
import GameBoard from 'app/views/GameBoard';

const Home = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      game: ['game']
    });

  },
  view (ctrl) {
    const inGame = !!ctrl.data.game;
    return m('.Home', (function() {
      if(inGame) {
        return m(GameBoard);
      } else {
        return m(NewGameSetting);
      }
    })());
  }
};

export default Home;
