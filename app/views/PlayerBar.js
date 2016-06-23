// showing all players basic stats
// and have control to determine to show which player in PlayerBoard

import m from 'mithril';

import B from 'app/broker';

import { BindData } from 'app/utils';

import './playerbar.css';

const PlayerBar = {
  controller () {
    const ctrl = this;

    BindData(ctrl, {
      currentPlayer: ['game', 'current-player'],
      players: ['game', 'players'],
      showing: ['game', 'showing-player'],
    });

    ctrl.showPlayer = (i) => {
      B.do({
        action: 'game/show-player',
        player: i
      });
    };
  },
  view (ctrl) {
    return m('.PlayerBar.row', ctrl.data.players.map((player, i) => {
      const isActive = (i == ctrl.data.currentPlayer) ? '' : '.hide';
      const showing = (ctrl.data.showing == i) ? '.showing' : '';
      return [
        m('.Active' + isActive, m.trust('&#9733;')),
        m('.PlayerBox.row' + showing, {
          onclick: ctrl.showPlayer.bind(ctrl, i)
        }, [
          m('.PlayerName', 'P' + (i + 1)),
          m('.Score', player.score),
        ]),
      ];
    }));
  },
};

export default PlayerBar;


