import m from 'mithril';
import B from 'app/broker';
import _ from 'underscore';

import Card from 'app/widgets/Card';
import Noble from 'app/widgets/Noble';

import {colors} from 'app/data/game-setting';

import { BindData } from 'app/utils';

import './gameboard.css';

function Cards(cards) {
  return cards.map(card => {
    return m(Card, card);
  });
}

const GameBoard = {
  controller () {
    const ctrl = this;
    BindData(ctrl, {
      cards1: ['game', 'cards1'],
      cards2: ['game', 'cards2'],
      cards3: ['game', 'cards3'],
      deck1: ['game', 'deck1'],
      deck2: ['game', 'deck2'],
      deck3: ['game', 'deck3'],
      resource: ['game', 'resource'],
      nobles: ['game', 'nobles'],
    });

    ctrl.resourceTypes = colors.concat(['gold']);
  },
  view (ctrl) {
    return m('.GameBoard', [
      m('.Nobles', ctrl.data.nobles.map(noble => {
        return m(Noble, noble);
      })),
      m('.Cards', [
        m('.Rank', [
          Cards(ctrl.data.cards3),
          m('.Card.FakeCard', ctrl.data.deck3.length),
        ]),
        m('.Rank', [
          Cards(ctrl.data.cards2),
          m('.Card.FakeCard', ctrl.data.deck2.length),
        ]),
        m('.Rank', [
          Cards(ctrl.data.cards1),
          m('.Card.FakeCard', ctrl.data.deck1.length),
        ]),
      ]),
      m('.Resources', ctrl.resourceTypes.map(type => {
        return m('.Resource.' + type, [
          m('.Indicator', ctrl.data.resource[type]),
        ]);
      })),
    ]);
  },
};

export default GameBoard;
