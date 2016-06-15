import m from 'mithril';

import Layout from 'app/views/Layout';
import Home from 'app/views/Home'

let routes = {
  '/': Home,
}

export function bindRoutes(el) {
  console.log('bind routes');
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

