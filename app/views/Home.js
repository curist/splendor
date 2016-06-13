var m = require('mithril');
var B = require('app/broker');
var utils = require('app/utils');

var Home = {
  controller: function() {
    var ctrl = this;
    utils.BindData(ctrl, {
      count: ['count'],
    });

    this.inc = function() {
      B.do({
        action: 'inc'
      });
    }
    this.add2 = function() {
      B.do({
        action: 'add2'
      });
    }
    this.reset = function() {
      B.do({
        action: 'reset-counter'
      });
    }
  },
  view: function(ctrl) {
    return m('div', [
      m('h1', 'h1 title'),
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

module.exports = Home;
