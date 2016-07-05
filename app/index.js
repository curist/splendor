import m from 'mithril';

import { syncLocalStorage } from 'app/utils';
import { bindRoutes } from 'app/routes';

import 'normalize.css';

function mountApplication() {
  const el = document.getElementById('app');
  bindRoutes(el);
  m.route(m.route());
}

function init() {
  FastClick.attach(document.body);

  require('app/style.css');
  require('app/actions');

  syncLocalStorage();
  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();

  // setup debug
  localStorage.debug = 'app/*';
}

