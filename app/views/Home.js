import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import { BindData } from 'app/utils';

import './home.css';

import allCards from 'app/data/cards';
import Card from 'app/widgets/Card';
import NewGameSetting from 'app/views/NewGameSetting';
import GameBoard from 'app/views/GameBoard';
import PlayerBoard from 'app/views/PlayerBoard';
import ActionWindow from 'app/widgets/ActionWindow';
import ReservedCards from 'app/widgets/ReservedCards';

const Home = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      game: ['game'],
      action: ['game', 'action'],
      players: ['game', 'players'],
      currentPlayer: ['game', 'current-player'],
    });

  },
  view (ctrl) {
    const inGame = !!ctrl.data.game;
    return m('.Home', (function() {
      if(inGame) {
        const currentPlayer = ctrl.data.players[ctrl.data.currentPlayer];
        return [
          m(GameBoard),
          m('.row', ctrl.data.players.map((player, i) => {
            return m(PlayerBoard, {
              isActive: (i == ctrl.data.currentPlayer),
              player: player,
            });
          })),
          (function () {
            if(ctrl.data.action) {
              return m(ActionWindow);
            }
          })(),
          m(ReservedCards, currentPlayer),
        ];
      } else {
        return m(NewGameSetting);
      }
    })());
  }
};

export default Home;
