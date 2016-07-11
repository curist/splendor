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
  const $body = document.getElementsByTagName('body')[0];
  $body.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, false);

  require('app/style.less');
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

