var m = require('mithril');
var B = require('app/broker');

require('app/actions');

var Home = require('app/views/Home');

window.onload = function() {
  m.mount(document.getElementById('app'), Home);
}
