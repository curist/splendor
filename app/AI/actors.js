const AIs = require('./index.js');

let actors = [];

export function initActors(actorNames) {
  actors = actorNames.map(name => {
    if(name == 'human') {
      return 'human';
    }
    const aiName = name.split(':')[1];
    const ai = new AIs[aiName];
    return ai;
  });
}

export function getActors() {
  return actors;
}
