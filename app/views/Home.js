var m = require('mithril');
var B = require('app/broker');
var utils = require('app/utils');

var Greeter = require('app/views/Greeter');
var Counter = require('app/views/Counter');

require('./home.css');

var Home = {
  controller: function() {
  },
  view: function(ctrl) {
    return m('div.Home', [
      m('h1', 'Home'),
      m(Greeter),
      m(Counter),
    ]);
  }
}

module.exports = Home;
