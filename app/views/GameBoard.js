import m from 'mithril';

const GameBoard = {
  controller () {

  },
  view () {
    return m('.GameBoard', [
      m('.Nobles'),
      m('.Cards', [
        m('.rank3'),
        m('.rank2'),
        m('.rank1'),
      ]),
      m('.Resources'),
    ]);
  },
};

export default GameBoard;
