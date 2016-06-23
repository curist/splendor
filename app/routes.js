import m from 'mithril';

import Layout from 'app/views/Layout';
import Home from 'app/views/Home';

const debug = require('debug')('app/routes');

let routes = {
  '/': Home,
};

export function bindRoutes(el) {
  debug('bind routes');
  m.route.mode = 'hash';
  m.route(el, '/', wrapRoutes(routes));
}

function wrapRoutes(routes) {
  let wrappedRoutes = Object.keys(routes).reduce((r, k) => {
    r[k] = m(Layout, {}, routes[k]);
    return r;
  }, {});
  return wrappedRoutes;
}

