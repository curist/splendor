var m = require('mithril');
var B = require('app/broker');
var utils = require('app/utils');


var Counter = {
  controller: function() {
    var ctrl = this;
    utils.BindData(ctrl, {
      count: ['count'],
    });

    this.inc = function() {
      B.do({
        action: 'counter-inc'
      });
    }
    this.add2 = function() {
      B.do({
        action: 'counter-add2'
      });
    }
    this.reset = function() {
      B.do({
        action: 'counter-reset'
      });
    }
  },
  view: function(ctrl) {
    return m('div', [
      m('h1', 'Counter'),
      m('p', [
        'count: ',
        ctrl.data.count
      ]),
      m('button', {
        onclick: ctrl.inc.bind(ctrl),
      }, 'inc'),
      m('button', {
        onclick: ctrl.add2.bind(ctrl),
      }, 'add 2'),
      m('button', {
        onclick: ctrl.reset.bind(ctrl),
      }, 'reset'),
    ]);
  }
}

module.exports = Counter;
