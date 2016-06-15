import m from 'mithril';
import B from 'app/broker';
import db from 'app/db';

import Home from 'app/views/Home'

import 'normalize.css';

function mountApplication() {
  m.mount(document.getElementById('app'), Home);
}

function init() {
  require('app/style.css');
  require('app/actions');
  require('app/firebase');

  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();
}

