import db from 'app/db';

const AIs = require('./index.js');

let actors = [];

export function initActors(actorNames) {
  const playerCount = actorNames.length;
  const winGameScore = db.get(['game', 'win-game-score']);

  actors = actorNames.map((name, i) => {
    const store = db.select('actor-stores', i);
    if(name == 'human') {
      return 'human';
    }
    const aiName = name.split(':')[1];
    let AI = AIs[aiName];
    if(!AI) {
      return name;
    }
    let ai = new AI(store, i, playerCount, winGameScore);
    ai.isAI = true;
    return ai;
  });
}

export function getActors() {
  return actors;
}
