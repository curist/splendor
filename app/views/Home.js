var m = require('mithril');
var B = require('app/broker');
var utils = require('app/utils');

var Counter = require('app/views/Counter');

require('./home.css');

var Home = {
  controller: function() {
  },
  view: function(ctrl) {
    return m('div', [
      m('h1', 'Home'),
      m(Counter),
    ]);
  }
}

module.exports = Home;
