import _ from 'underscore';
import {
  hasEnoughResourceForCard,
  flattenResources,
  zipResources,
  playerBoughtCard,
}
from './helpers';

import {
  canBuyCard,
  canTakeNoble
}
from 'app/validates';

const DEBUG = true;
const debug = require('debug')('app/AI/Dangerous_Yovan');

const colors = [
  'white', 'blue', 'green', 'red', 'black'
];

function table(data, fields) {
  if (!DEBUG) {
    return;
  }
  if (fields) {
    window['console'].table(data, fields);
  } else {
    window['console'].table([data]);
  }
}

function countResources(resources) {
  return Object.keys(resources).reduce((total, k)=> {
    return total + resources[k];
  }, 0);
}

function getAffordableCards(player, cards) {
  return cards.filter(hasEnoughResourceForCard.bind(null, player));
}

function getNobleValue(nobles) {

  let point = 0;
  let removeKey = -1;
  for (let key in nobles) {
    let totalColors = 0;
    for (let color in colors) {
      if (nobles[key][colors[color]] != 0)
        totalColors += nobles[key][colors[color]];
    }
    if (totalColors == 0) {
      removeKey = key;
      point = 3;
    }
  }
  if (removeKey != -1) {
    nobles.splice(removeKey, 1);
  }

  return point;
}

function isOutOfLimitResource(card) {

  for (let i in colors) {
    if (card[colors[i]] > 4)
      return true;
  }
  return false;
}

function countTotalResources(resoures) {
	let count = 0;
	
	count += resoures.white;
	count += resoures.blue;
	count += resoures.green;
	count += resoures.red;
	count += resoures.black;

	return count;
}

function calculateBuyCardRounds(card, resources, playerResources) {
	
	let round = 0;
	let remainColorCount = 0;
	let myResources = cloneResoures(resources);
	let rstMyResources = countResources(myResources);
 
	let rstPlayerResources = countResources(playerResources);
  let requiredColors = [{
    color : 'white',
    value : 0
  }, {
    color : 'blue',
    value : 0
  }, {
    color : 'green',
    value : 0
  }, {
    color : 'red',
    value : 0
  }, {
    color : 'black',
    value : 0
  }
  ];
 /* 
  if(rstPlayerResources > 7) {
		return {
			'rounds' : 10000,
			'remainColorCount' : 0
		};  
  }
*/
  for (let i in requiredColors) {
    let diff = card[requiredColors[i].color] - playerResources[requiredColors[i].color];
    requiredColors[i].value = diff < 0 ? 0:diff;
    if (myResources[requiredColors[i].color] < requiredColors[i].value)
		return {
			'rounds' : 10000,
			'remainColorCount' : 0
		};
  }
  requiredColors.sort(function (a, b) {
    return b.value - a.value;
  });

  let totalRequired = 0;
  for (let i in requiredColors) {
    totalRequired += requiredColors[i].value;
  }

  if (totalRequired == 0) {
    return {
		'rounds' : 1,
		'remainColorCount' : 0
	};
  }
  round = 1;
  let loop = 0;

  while (loop < 3) {
    let cout = 3;
	if(rstPlayerResources > 10) {
			return {
				'rounds' : 10000,
				'remainColorCount' : 0
			};			
	}
    for (let i in requiredColors) {
      if (requiredColors[i].value > 0 && myResources[requiredColors[i].color]  > 0) {
		requiredColors[i].value -= 1;
		myResources[requiredColors[i].color] -= 1;
		cout -= 1;
      }
	
      if (cout == 0)
        break;
    }
	
	rstPlayerResources += 3;
	if(rstPlayerResources > 10) {
			return {
				'rounds' : 10000,
				'remainColorCount' : 0
			};			
	}
		
	if(cout != 3 && countTotalResources(myResources) >= cout) {
		remainColorCount += cout;

		if(remainColorCount > 10) {

			return {
				'rounds' : 10000,
				'remainColorCount' : 0
			};			
		}		
	}
	
    round += 1;
    let totalRemaind = 0;
    for (let i in requiredColors) {
      totalRemaind += requiredColors[i].value;
    }
    if (totalRemaind == 0) {
		return {
			'rounds' : round,
			'remainColorCount' : remainColorCount
		};
    }

    loop += 1;
  }

	return {
		'rounds' : 10000,
		'remainColorCount' : 0
	};
}



function calculateMinGameRounds(state, result, isFirst) {
	
  //clone data
  let tempState = cloneState(state);
  let tempResult = cloneResult(result);
  let tempNobles = tempState.nobles;
  let tempScore = tempState.score;
  let tempAllCards = tempState.cards.concat(tempState.reservedCards);
  let tempResources = tempState.resources;
  let tempPlayerResources = tempState.playerResources;

  let roundList = [];
  for (let key in tempAllCards) {
    roundList.push(cloneResult(tempResult));
  }

  if (tempResult.score >= 15) {
    return tempResult;
  }

  if (tempAllCards.length == 0) {
    return tempResult;
  }


	
  for (let i in tempAllCards) {

    let myResult = cloneResult(result);
    let myState = cloneState(state);
    let nobles = myState.nobles;
    let score = cloneScore(myState.score);
    let allCards = myState.cards.concat(myState.reservedCards);
    let resources = myState.resources;
    let playerResources = myState.playerResources;


	

	
	
	let lastCardRequiredColors = [{
		color : 'white',
		value : 0
		}, {
		color : 'blue',
		value : 0
		}, {
		color : 'green',
		value : 0
		}, {
		color : 'red',
		value : 0
		}, {
		color : 'black',
		value : 0
		}
	];
	
	if(!isFirst) {	

		for (let j in lastCardRequiredColors) {
			let r =  tempResult.lastCard[lastCardRequiredColors[j].color] - tempPlayerResources[lastCardRequiredColors[j].color];
			lastCardRequiredColors[j].value = r<0 ? 0 : r;
		}
	}

	if(!isFirst) {	
	/*	for(let color in playerResources) {
			let r =  playerResources[color] - lastCardRequiredColors[color].value;
			playerResources[color] = r > 0 ? r : 0;
			resources[color] -= playerResources[color];		
		}
		*/
		
		for(let color in playerResources) {
			resources[color] += playerResources[color];
		}
	/*if(!isFirst) {
		if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
			debug('before playerResources=>'+JSON.stringify(playerResources));
			debug('before lastCardRequiredColors=>'+JSON.stringify(lastCardRequiredColors));
		}
	}	*/
		for(let j in lastCardRequiredColors) {
		//	let r =  playerResources[lastCardRequiredColors[j].color] - lastCardRequiredColors[j].value;
		//	playerResources[lastCardRequiredColors[j].color] = r > 0 ? r : 0;
		//	resources[lastCardRequiredColors[j].color] -= playerResources[lastCardRequiredColors[j].color];		
			let r =  playerResources[lastCardRequiredColors[j].color] + lastCardRequiredColors[j].value - tempResult.lastCard[lastCardRequiredColors[j].color];
			playerResources[lastCardRequiredColors[j].color] = r > 0 ? r : 0;
			resources[lastCardRequiredColors[j].color] -= playerResources[lastCardRequiredColors[j].color];
		}
		if(!isFirst) {
			if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
				//debug('after playerResources=>'+JSON.stringify(playerResources));
			}
		}	
	} else {
		/*debug('===============================================');
		debug('playerResources---==>'+JSON.stringify(playerResources));
		debug('resources---==>'+JSON.stringify(resources));
		debug('tempAllCards card---==>'+JSON.stringify(tempAllCards[i]));
		debug('resources count---==>'+countTotalResources(resources));
		debug('===============================================11');*/
	}
	/*======================================================================*/
	/*======================================================================*/

	lastCardRequiredColors.sort(function (a, b) {
		return b.value - a.value;
	});

	let requiredColors = [{
		color : 'white',
		value : 0
		}, {
		color : 'blue',
		value : 0
		}, {
		color : 'green',
		value : 0
		}, {
		color : 'red',
		value : 0
		}, {
		color : 'black',
		value : 0
		}
	];

	for (let j in requiredColors) {
		requiredColors[j].value = tempAllCards[i][requiredColors[j].color] - playerResources[requiredColors[j].color];
	}

	requiredColors.sort(function (a, b) {
		return b.value - a.value;
	});
	let remainCount = myResult.remainColorCount;

/*	let times = Math.floor( myResult.remainColorCount/(myResult.lastRound-1) )+1;
	
	for(let j in lastCardRequiredColors) {
		lastCardRequiredColors[j].times = times;
	}
*/	/*
	if(!isFirst) {
		if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
			debug('before lastCard=>'+JSON.stringify(myResult.lastCard));
			debug('before tempAllCards[i]=>'+JSON.stringify(tempAllCards[i]));
			debug('before remainCount=>'+remainCount);
			debug('before playerResources=>'+JSON.stringify(playerResources));
		}
	}*/
	// to get best colors
	for(let j=0; j<myResult.remainColorCount; j++) {
	if(!isFirst) {
									if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
										//debug('remainColorCount=>'+j);
										
									}
		}
		for(let k in requiredColors) {
			if(requiredColors[k].value > 0) {
				let max = lastCardRequiredColors[0].value;	// lastCardRequiredColors has sorted by value
				
				if(resources[requiredColors[k].color] > 0) {
					let flag = false;
					for(let w in lastCardRequiredColors) {
						if(requiredColors[k].color == lastCardRequiredColors[w].color) {
							if(lastCardRequiredColors[w].value < max) {
								resources[requiredColors[k].color] -= 1;
								playerResources[requiredColors[k].color] += 1;
								lastCardRequiredColors[w].value += 1;
								remainCount -= 1;
								flag = true;
								if(!isFirst) {
									if(myResult.lastCard.key == 75 && tempAllCards[i].key == 36) {
									//	debug('lastCardRequiredColors[w] color=>'+lastCardRequiredColors[w].color);
									//	debug('requiredColors=>'+JSON.stringify(requiredColors));
									}
								}
								requiredColors.sort(function (a, b) {
									return b.value - a.value;
								});	
								if(!isFirst) {
									if(myResult.lastCard.key == 75 && tempAllCards[i].key == 36) {
									//	debug(' after requiredColors=>'+JSON.stringify(requiredColors));
									}
								}
								break;
							}
						}
					}
					if(flag)
						break;
				}
				
				/*
				if(resources[requiredColors[k].color] > 0 && playerResources[requiredColors[k].color] < myResult.lastRound-1 && playerResources[requiredColors[k].color] + myResult.lastCard[requiredColors[k].color] < max
					&& requiredColors[k].times> 0) {
					requiredColors[k].times -= 1;
					resources[requiredColors[k].color] -= 1;
					playerResources[requiredColors[k].color] += 1;
					
					requiredColors.sort(function (a, b) {
						return b.value - a.value;
					});	
					break;
				}
				*/
			}
		}
	}
	/*
	if(!isFirst) {
		if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
			debug('before random remainCount=>'+remainCount);
			debug('before random playerResources=>'+JSON.stringify(playerResources));
		}
	}*/
	
	// random to get colors
	for(let j=0; j < remainCount; j++) {
		if(!isFirst) {
									if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
										//debug('random remainColorCount=>'+j);
									}
		}
		for(let k in requiredColors) {
			if(requiredColors[k].value == 0) {
				let max = lastCardRequiredColors[0].value;	// lastCardRequiredColors has sorted by value
				if(resources[requiredColors[k].color] > 0) {
					let flag = false;
					for(let w in lastCardRequiredColors) {
						if(requiredColors[k].color == lastCardRequiredColors[w].color) {
							if(lastCardRequiredColors[w].value < max) {
								resources[requiredColors[k].color] -= 1;
								playerResources[requiredColors[k].color] += 1;
								lastCardRequiredColors[w].value += 1;
								//remainCount -= 1;
								flag = true;
								break;
							}
						}
					}
					if(flag)
						break;
				}			
			}
		}		
	}
	/*
	if(!isFirst) {
		if(myResult.lastCard.key == 76 && tempAllCards[i].key == 44) {
			debug('agter random remainCount=>'+remainCount);
			debug('agter random playerResources=>'+JSON.stringify(playerResources));
		}
	}*/
	//debug(' card-->'+JSON.stringify(tempAllCards[i]));
	//debug('before resources->'+JSON.stringify(resources));
	//debug('before playerResources->'+JSON.stringify(playerResources));
	
	
	
	let cardRounds = calculateBuyCardRounds(tempAllCards[i], resources, playerResources);
	/*
	if(isFirst) {
		debug('tempAllCards==>'+JSON.stringify(tempAllCards[i]));
		debug('JSON.stringify(resources)==>'+JSON.stringify(resources));
		debug('JSON.stringify(playerResources)==>'+JSON.stringify(playerResources));
		debug('cardRounds.rounds==>'+cardRounds.rounds);
	}
	*/
	//debug('after cardRounds.rounds='+cardRounds.rounds);
	//debug('before resources->'+JSON.stringify(resources));
	//debug('before playerResources->'+JSON.stringify(resources));

    if (cardRounds.rounds >= 100) {
      roundList[i].rounds = myResult.rounds + 10000;
      continue;
    }

    myResult.rounds += cardRounds.rounds;
    myResult.remainColorCount = cardRounds.remainColorCount;
    myResult.lastRound = cardRounds.rounds;
  
	
    //remove current card.
    let currentCard = allCards.splice(i, 1);
    currentCard[0].rounds = cardRounds.rounds;
    currentCard[0].playerResource = playerResources;
	
    score += currentCard[0].points;
    // other cards deduct currentCard value
    for (let key in nobles) {
      if (nobles[key][currentCard[0].provides] > 0) {
        nobles[key][currentCard[0].provides] -= 1;
      }
    }

    score += getNobleValue(nobles);

    //consider card provides
    for (let key in allCards) {
      if (allCards[key][currentCard[0].provides] > 0) {
        allCards[key][currentCard[0].provides] -= 1;
      }
    }	
	
    //write all cards value to state
    myState.cards = allCards;

    myResult.cards.push(cloneCard(currentCard[0]));
    myResult.score = score;
    myResult.lastCard = cloneCard(currentCard[0]);

    myState.score = score;
	
    if (myResult.score >= 15) {
      roundList[i] = myResult;
    } else {
      roundList[i] = calculateMinGameRounds(myState, myResult, false);
    }

  }

  if (canArriveEnd(roundList)) {
    roundList.sort(function (a, b) {
      return a.rounds - b.rounds;
    });
  } else {

    let maxCardsNumber = 0;
    for (let j in roundList) {
      if (maxCardsNumber < roundList[j].cards.length) {
        maxCardsNumber = roundList[j].cards.length;
      }
    }
    roundList.sort(function (a, b) {

      if (b.cards.length == maxCardsNumber && a.cards.length == maxCardsNumber) {

		if( a.rounds - b.rounds < 0){
			return -1;
		} else if(a.rounds - b.rounds > 0) {
			return 1;
		} else {
			if (a.cards.length != 0 && b.cards.length != 0) {
				
				if (a.cards[0].total_cost < b.cards[0].total_cost) {
					return -1;
				} else if  (a.cards[0].total_cost > b.cards[0].total_cost) {
					return 1;
				}
			}	
			return 0;
		}

      } else if (b.cards.length == maxCardsNumber) {
        return 1;
      } else if (a.cards.length == maxCardsNumber) {
        return -1;
      } else {
			if( a.rounds - b.rounds < 0){
				return 1;
			} else if(a.rounds - b.rounds > 0) {
				return -1;
			} else {
				if (a.cards.length != 0 && b.cards.length != 0) {
				//	debug('a.cards[0].total_cost-->'+a.cards[0].total_cost+'b.cards[0].total_cost-->'+b.cards[0].total_cost);
					if (a.cards[0].total_cost < b.cards[0].total_cost) {
					//	debug('<<<<<<   a.cards[0].total_cost=>'+a.cards[0].total_cost+'    b.cards[0].total_cost=>'+b.cards[0].total_cost);
						return -1;
					} else if  (a.cards[0].total_cost > b.cards[0].total_cost) {
					//	debug('>>>>>>   a.cards[0].total_cost=>'+a.cards[0].total_cost+'    b.cards[0].total_cost=>'+b.cards[0].total_cost);
						return 1;
					}
				}	
				return 0;
			}

      }
	
    });

  }
  //debug('roundList-->'+JSON.stringify(roundList));
  return roundList[0];
}

function canArriveEnd(roundList) {

  for (let i in roundList) {
    if (roundList[i].rounds < 10000)
      return true;
  }
  return false;
}

function getAvailableCard(orderedCards, availableCards) {

  for (let i in orderedCards) {
    for (let j in availableCards) {
      if (availableCards[j].key == orderedCards[i].key) {
        return availableCards[j];
      }
    }
  }

  return null;
}

function cloneState(state) {

  let cards = [],
    reservedCard = [];
  let nobles = [];
  for (let i in state.cards) {
    cards.push(cloneCard(state.cards[i]));
  }

  for (let i in state.reservedCards) {
    reservedCard.push(cloneCard(state.reservedCards[i]));
  }

  for (let i in state.nobles) {
    nobles.push(cloneNoble(state.nobles[i]));
  }
  
  return {
    'cards' : cards,
    'reservedCards' : reservedCard,
    'score' : state.score,
    'nobles' : nobles,
    'resources' : {
      'white' : state.resources.white,
      'blue' : state.resources.blue,
      'green' : state.resources.green,
      'red' : state.resources.red,
      'black' : state.resources.black,
      'gold' : state.resources.gold
    },
	'playerResources' : {
		'white' : isUndefined(state.playerResources, 'white'),
		'blue' : isUndefined(state.playerResources, 'blue'),
		'green' : isUndefined(state.playerResources, 'green'),
		'red' : isUndefined(state.playerResources, 'red'),
		'black' : isUndefined(state.playerResources, 'black')
	}
  };
}
function isUndefined(data, color) {
	if(data) {
		return data[color];
	}else {
		return 0;
	}
}


function cloneCard(card) {

  return {
    'rank' : card.rank,
    'white' : card.white,
    'blue' : card.blue,
    'green' : card.green,
    'red' : card.red,
    'black' : card.black,
    'points' : card.points,
    'provides' : card.provides,
    'total_cost' : card.total_cost,
    'key' : card.key,
    'status' : card.status,
    'rounds' : card.rounds,
    'playerResource' : {
		'white' : isUndefined(card.playerResource, 'white'),
		'blue' : isUndefined(card.playerResource, 'blue'),
		'green' : isUndefined(card.playerResource, 'green'),
		'red' : isUndefined(card.playerResource, 'red'),
		'black' : isUndefined(card.playerResource, 'black')
    }
  };
}

function cloneNoble(noble) {

  return {
    'white' : noble.white,
    'blue' : noble.blue,
    'green' : noble.green,
    'red' : noble.red,
    'black' : noble.black,
    'points' : noble.points,
    'key' : noble.key,
  };
}

function cloneResult(result) {

  let cards = [];

  for (let i in result.cards) {
    cards.push(cloneCard(result.cards[i]));
  }

  return {
    'cards' : cards,
    'rounds' : result.rounds,
	'lastRound' : result.lastRound,
	'lastCard' : cloneCard(result.lastCard),
	'remainColorCount' : result.remainColorCount,
    'score' : result.score
  };
}

function cloneScore(score) {

  let myScore = [score];
  return myScore[0];
}

function cloneResoures(resources) {

	return {
		'white' : resources.white,
		'blue' : resources.blue,
		'green' : resources.green,
		'red' : resources.red,
		'black' : resources.black,
		'gold' : resources.gold
	};
}

function getOriginCard(originCards, card) {
	
	for( let i in originCards) {
		if(originCards[i].key == card.key){
			return originCards[i];
		}
	}
	return null;
}

export default class Dangerous_Yovan {
  constructor(store, playerIndex, playerCount, winGameScore) {
    this.store = store;
    this.playerIndex = playerIndex;
    this.playerCount = playerCount;
    this.winGameScore = winGameScore;
  }

  turn(state) {

    // actions
    // 1. buy a card
    // 2. hold a card
    // 3. take resources
    // strategry:
    //   1. take resources when having total <= 7
    //   2. buy a card otherwise
    //      a. having points better
    //   3. hold a card otherwise
    const getColorInitalValue = function () {

      switch (state.players.length) {
      case 2:
        return 4;
      case 3:
        return 5;
      case 4:
        return 7;
      }
    };

    const {
      player
    }
       = state;
    let result = {
      'cards' : [],
      'rounds' : 0,
		'lastRound' : 0,
		'lastCard' : {},
		'remainColorCount' : 0,
      'score' : 0
    };

    let tempState = cloneState(state);
    let tempNobles = tempState.nobles;
    let tempCards = tempState.cards;

	tempState.score = state.player.score;
	tempState.playerResources.white = state.player.resources.white;
	tempState.playerResources.blue = state.player.resources.blue;
	tempState.playerResources.green = state.player.resources.green;
	tempState.playerResources.red = state.player.resources.red;
	tempState.playerResources.black = state.player.resources.black;	
 
    let tempReservedCards = tempState.reservedCards;

    //consider  player resources
   for (let i in tempCards) {
      for (let j in colors) {
     //   let cardRequiredColor = tempCards[i][colors[j]] - state.player.resources[colors[j]] - state.player.bonus[colors[j]];
			let cardRequiredColor = tempCards[i][colors[j]] - state.player.bonus[colors[j]];
        tempCards[i][colors[j]] = cardRequiredColor > 0 ? cardRequiredColor : 0;
      }
    }

    for (let i in tempReservedCards) {
      for (let j in colors) {
      //  let cardRequiredColor = tempReservedCards[i][colors[j]] - state.player.resources[colors[j]] - state.player.bonus[colors[j]];
			let cardRequiredColor = tempReservedCards[i][colors[j]] - state.player.bonus[colors[j]];
        tempReservedCards[i][colors[j]] = cardRequiredColor > 0 ? cardRequiredColor : 0;
      }
    }

    result = calculateMinGameRounds(tempState, result, true);
	
    debug('state.cards.length-->' + state.cards.length);
    debug('rounds time-->' + result.rounds);
    debug('rounds score-->' + result.score);

    let getIndex = function getCardIndex(key) {
      for (let o in state.cards) {
        if (state.cards[o].key == key) {
          return parseInt(o) + 1;
        }
      }
    };

    for (let i in result.cards) {
      result.cards[i].order = getIndex(result.cards[i].key);
    }

    let rfields = ['order', 'rank', 'key', 'total_tost', 'revalue', 'provides'].concat(colors);
    for (let o in result.cards) {
      table(result.cards[o]);
	debug('player resource->>' + JSON.stringify(result.cards[o].playerResource));
    }

    const allCards = state.cards.concat(player.reservedCards);

  //  let bestCard = result.cards.length != 0 ? result.cards[0] : null;
	let bestCard = result.cards.length != 0 ? getOriginCard(allCards, result.cards[0] ) : null;
	
    let canBuy;
    if (bestCard == null) {
      canBuy = false;
    } else {
		debug('bestCard.key->'+bestCard.key);
      canBuy = hasEnoughResourceForCard(player, bestCard);
    }

    // 2. try to buy a card
    if (canBuy) {

      return {
        action : 'buy',
        card : bestCard,
      };
    }

    const resCount = countResources(player.resources);
    // 1. take resources
    if (resCount <= 7) {
      const availableColors = colors.filter(color=> {
        return state.resources[color] > 0;
      });

      let requiredColors = [{
        color : 'white',
        value : 0
      }, {
        color : 'blue',
        value : 0
      }, {
        color : 'green',
        value : 0
      }, {
        color : 'red',
        value : 0
      }, {
        color : 'black',
        value : 0
      }
      ];

      if (bestCard != null) {
        for (let i in requiredColors) {
          let remaindColor = bestCard[requiredColors[i].color] - player.bonus[requiredColors[i].color] - player.resources[requiredColors[i].color];
          if (remaindColor > 0) {
            requiredColors[i].value = remaindColor > 0 ? remaindColor : 0;
          }
        }
      }

      requiredColors.sort(function (a, b) {
        return b.value - a.value;
      });

      let cout = 3;
      let pickColors = new Array();
      let currentColors = ['white', 'blue', 'green', 'red', 'black'];
      for (let i in requiredColors) {
        if (requiredColors[i].value != 0 && state.resources[requiredColors[i].color] != 0) {
          pickColors.push(requiredColors[i].color);
          cout -= 1;
          currentColors.splice(currentColors.indexOf(requiredColors[i].color), 1);
        }
        if (cout == 0)
          break;
      }

      for (let i in result.cards) {
		let cr =  getOriginCard(allCards, result.cards[i] );	
		for (let color in currentColors) {
          if (cout == 0)
            break;
          if ((cr[currentColors[color]] - player.bonus[currentColors[color]] - player.resources[currentColors[color]]) > 0) {
            if (state.resources[currentColors[color]] != 0) {
              pickColors.push(currentColors[color]);
              currentColors.splice(currentColors.indexOf(currentColors[color]), 1);
              cout -= 1;
            }
          }
        }
      }

      for (let color in _.shuffle(currentColors)) {
        if (cout == 0)
          break;
        if (state.resources[currentColors[color]] != 0) {
          pickColors.push(currentColors[color]);
          cout -= 1;
        }
      }
	debug('pickColors-->'+pickColors);
      return {
        action : 'resource',
        resources : zipResources(pickColors),
      };
    }

    const affordableCards = getAffordableCards(player, allCards);
    const availableCard = getAvailableCard(result.cards, affordableCards);
    if (availableCard) {
      return {
        action : 'buy',
        card : availableCard,
      };
    }

    if (bestCard == null) {
      bestCard = allCards[0];
    }
    // 3. hold a card
    return {
      action : 'hold',
      card : bestCard,
    };
  }

  dropResources(state, resources) {
    return zipResources(_.shuffle(flattenResources(resources)).slice(0, 10));
  }

  pickNoble(state, nobles) {
    const i = Math.floor(nobles.length * Math.random());
    return nobles[i];
  }
}
