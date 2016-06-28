import m from 'mithril';

import { bindRoutes } from 'app/routes';

import 'normalize.css';

function mountApplication() {
  const el = document.getElementById('app');
  bindRoutes(el);
  m.route(m.route());
}

function init() {
  require('app/style.css');
  require('app/actions');

  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();

  // setup debug
  localStorage.debug = 'app/*';
}

