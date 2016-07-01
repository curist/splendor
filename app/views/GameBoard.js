import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import Card from 'app/widgets/Card';
import Noble from 'app/widgets/Noble';

import { canBuyCard } from 'app/validates';
import {colors} from 'app/data/game-setting';
import { BindData } from 'app/db';

const debug = require('debug')('app/views/GameBoard');

import './gameboard.css';

function Cards(player, cards) {
  return cards.map((card, i) => {
    if(card.status == 'empty') {
      return m(Card, {
        key: `empty-${i}`,
        status: 'empty'
      });
    }
    return m(Card, Object.assign({
      affordable: canBuyCard(player, card)
    }, card));
  });
}

const GameBoard = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      currentPlayerIndex: ['game', 'current-player'],
      players: ['game', 'players'],
      cards1: ['game', 'cards1'],
      cards2: ['game', 'cards2'],
      cards3: ['game', 'cards3'],
      deck1: ['game', 'deck1'],
      deck2: ['game', 'deck2'],
      deck3: ['game', 'deck3'],
      resources: ['game', 'resources'],
      nobles: ['game', 'nobles'],
    });

    ctrl.resourceTypes = colors.concat(['gold']);

    ctrl.takeResource = (type) => {
      B.do({
        action: 'gameaction/take-resource',
        type: type,
      });
    };

    ctrl.holdRankCard = (rank) => {
      const deck = ctrl.data['deck' + rank];
      if(!deck || deck.length <= 0) {
        debug(`no cards @ deck ${rank}`);
        return;
      }
      B.do({
        action: 'gameaction/hold-a-rank-card',
        rank: rank
      });
    };
  },
  view (ctrl) {
    const player = ctrl.data.players[ctrl.data.currentPlayerIndex];
    return m('.GameBoard', [
      m('.Nobles', ctrl.data.nobles.map(noble => {
        return m(Noble, noble);
      })),
      m('.col', [
        m('.Rank.row', [
          Cards(player, ctrl.data.cards3),
          m('.Card.FakeCard', {
            key: 'fakecard3',
            onclick: ctrl.holdRankCard.bind(ctrl, 3),
          }, ctrl.data.deck3.length),
        ]),
        m('.Rank.row', [
          Cards(player, ctrl.data.cards2),
          m('.Card.FakeCard', {
            key: 'fakecard2',
            onclick: ctrl.holdRankCard.bind(ctrl, 2),
          }, ctrl.data.deck2.length),
        ]),
        m('.Rank.row', [
          Cards(player, ctrl.data.cards1),
          m('.Card.FakeCard', {
            key: 'fakecard1',
            onclick: ctrl.holdRankCard.bind(ctrl, 1),
          }, ctrl.data.deck1.length),
        ]),
      ]),
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource.' + type, {
          onclick: ctrl.takeResource.bind(ctrl, type),
        }, [
          m('.Indicator', ctrl.data.resources[type]),
        ]);
      })),
    ]);
  },
};

export default GameBoard;
