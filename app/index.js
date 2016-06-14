var m = require('mithril');
var B = require('app/broker');
var db = require('app/db');

function mountApplication() {
  var Home = require('app/views/Home');
  m.mount(document.getElementById('app'), Home);
}

function init() {
  var utils = require('app/utils');
  require('app/style.css');
  require('app/actions');

  utils.syncLocalStorage();
  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();
}

