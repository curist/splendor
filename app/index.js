var m = require('mithril');
var B = require('app/broker');

require('app/actions');

var Home = require('app/views/Home');

function mountApplication() {
  m.mount(document.getElementById('app'), Home);
}

window.onload = mountApplication;

if(module.hot) {
  module.hot.accept();
  mountApplication();
}

