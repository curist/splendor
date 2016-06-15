import m from 'mithril';
import B from 'app/broker';
import db from 'app/db';

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
  require('app/firebase');

  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();
}

