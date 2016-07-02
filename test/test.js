import assert from 'assert';

import { player, cardCantAfford, cardCanAfford1, cardCanAfford2 } from './data';

describe('validation', () => {
  describe('can buy card', () => {
    const f = require('app/validates').canBuyCard;
    it('should return true if player can buy a card', () => {
      assert.equal(f(player, cardCanAfford1), true);
      assert.equal(f(player, cardCanAfford2), true);
    });

    it('should return false if player cannot buy a card', () => {
      assert.equal(f(player, cardCantAfford), false);
    });
  });
});

describe('AI helpers', () => {
  describe('playerBoughtCard', () => {
    const f = require('app/AI/helpers').playerBoughtCard;
    it('should return original player if player can\'t buy the card', () => {
      const newPlayer = f(player, cardCantAfford);
      Object.keys(player.resources).forEach(color => {
        assert.equal(player.resources[color], newPlayer.resources[color]);
      });
      Object.keys(player.bonus).forEach(color => {
        assert.equal(player.bonus[color], newPlayer.bonus[color]);
      });
    });

    it('should return new player if player can buy the card', () => {
      const newPlayer = f(player, cardCanAfford1);
      assert.equal(newPlayer.resources.white, 0);
      assert.equal(newPlayer.resources.green, 0);
      assert.equal(newPlayer.bonus.white, 4);
    });
  });
});


