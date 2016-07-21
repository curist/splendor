export function composeGameState(db) {
  const cards = db.get(['game', 'cards1']).concat(
    db.get(['game', 'cards2'])
  ).concat(
    db.get(['game', 'cards3'])
  ).filter(card => {
    return card.status !== 'empty';
  });
  const playerIndex = db.get(['game', 'current-player']);
  const players = db.get(['game', 'players']);
  const player = players[playerIndex];
  const nobles = db.get(['game', 'nobles']);
  const resources = db.get(['game', 'resources']);
  const deckRemainings = {
    1: db.get(['game', 'deck1']).length,
    2: db.get(['game', 'deck2']).length,
    3: db.get(['game', 'deck3']).length,
  };
  return {
    cards, player, players, nobles,
    resources, deckRemainings,
  };
}
