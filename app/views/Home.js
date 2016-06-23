import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import { BindData } from 'app/utils';

import './home.css';

import allCards from 'app/data/cards';
import Card from 'app/widgets/Card';
import NewGameSetting from 'app/views/NewGameSetting';
import GameBoard from 'app/views/GameBoard';
import PlayerBar from 'app/views/PlayerBar';
import PlayerBoard from 'app/views/PlayerBoard';
import ActionWindow from 'app/widgets/ActionWindow';

const Home = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      game: ['game'],
      players: ['game', 'players'],
      showingPlayer: ['game', 'showing-player'],
    });

  },
  view (ctrl) {
    const inGame = !!ctrl.data.game;
    return m('.Home', (function() {
      if(inGame) {
        return [
          m(GameBoard),
          m(PlayerBar),
          m(PlayerBoard, {player: ctrl.data.players[ctrl.data.showingPlayer]}),
          m(ActionWindow),
        ];
      } else {
        return m(NewGameSetting);
      }
    })());
  }
};

export default Home;
