var m = require('mithril');
var B = require('app/broker');

function mountApplication() {
  require('app/style.css');
  require('app/actions');
  var Home = require('app/views/Home');
  m.mount(document.getElementById('app'), Home);
}

window.onload = mountApplication;

if(module.hot) {
  module.hot.accept();
  mountApplication();
}

