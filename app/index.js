var m = require('mithril');
var B = require('app/broker');

require('app/actions');

var Okay = require('app/views/Okay');

window.onload = function() {
  m.mount(document.getElementById('app'), Okay);
}
