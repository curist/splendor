import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import { BindData } from 'app/db';

import './home.less';

import allCards from 'app/data/cards';
import Card from 'app/widgets/Card';
import NewGameSetting from 'app/views/NewGameSetting';
import Summary from 'app/views/Summary';
import TournamentSummary from 'app/views/TournamentSummary';
import GameBoard from 'app/views/GameBoard';
import SinglePlayerBoard from 'app/views/SinglePlayerBoard';
import PlayerBoard from 'app/views/PlayerBoard';
import ActionWindow from 'app/widgets/ActionWindow';
import ReservedCards from 'app/widgets/ReservedCards';

const TournamentRounds = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      currentRound: ['tournament', 'currentRound'],
      rounds: ['tournament', 'rounds'],
    });
  },
  view (ctrl) {
    const currentRound = ctrl.data.currentRound;
    const rounds = ctrl.data.rounds;
    return m('.TournamentRound', `${currentRound} / ${rounds}`);
  },
};

const Home = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      game: ['game'],
      action: ['game', 'action'],
      turn: ['game', 'turn'],
      players: ['game', 'players'],
      showSummary: ['game', 'show-summary'],
      currentPlayer: ['game', 'current-player'],
    });

  },
  view (ctrl) {
    const inGame = !!ctrl.data.game;
    return m('.Home', (function() {
      if(inGame) {
        const isSinglePlayer = (ctrl.data.players.length == 1);
        const currentPlayer = ctrl.data.players[ctrl.data.currentPlayer];
        return [
          m(GameBoard),
          (function () {
            if(isSinglePlayer) {
              return m(SinglePlayerBoard, {
                turn: ctrl.data.turn,
                player: ctrl.data.players[0],
              });
            } else {
              return m('.row', ctrl.data.players.map((player, i) => {
                return m(PlayerBoard, {
                  isActive: (i == ctrl.data.currentPlayer),
                  player: player,
                });
              }));
            }
          })(),
          (function () {
            if(ctrl.data.game.mode == 'tournament') {
              return m(TournamentRounds);
            }
          })(),
          (function () {
            if(ctrl.data.action) {
              return m(ActionWindow);
            }
          })(),
          (function () {
            if(!ctrl.data.showSummary) {
              return;
            }
            if(ctrl.data.game.mode == 'tournament') {
              return m(TournamentSummary);
            }
            return m(Summary);
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
