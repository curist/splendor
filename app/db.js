import m from 'mithril';
import Baobab from 'baobab';

const db = new Baobab({}, {
  immutable: module.hot ? false : true,
});

export function BindData(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(propName => {
    const path = bindings[propName];
    const v = db.get(path);
    controller.data[propName] = v;
  });

  let watcher = controller._w = db.watch(bindings);
  let callback = (e) => {
    m.startComputation();
    const data = e.target.get();
    controller.data = data;
    m.endComputation();
  };
  watcher.on('update', callback);

  // monkey patch onunload callback fn
  // register onunload after inited component
  // so we can avoid override existing onunload callback
  setTimeout(() => {
    controller.onunload = (function (origOnunload) {
      origOnunload = (origOnunload || function(){}).bind(controller);
      return () => {
        watcher.release();
        origOnunload();
      };
    })(controller.onunload);
  }, 0);
}

// in development mode, expose db
if(module.hot) {
  window.db = db;
}

export default db;
