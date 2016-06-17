import m from 'mithril';
import db from 'app/db';

var utils = {};

// bind data to mithril controller
utils.BindData = function BindData(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(propName => {
    const path = bindings[propName];
    const v = db.get(path);
    controller.data[propName] = v;
  });

  let watcher = controller._w = db.watch(bindings);
  watcher.on('update', e => {
    const data = e.target.get();
    controller.data = data;
    m.redraw();
  });
};

module.exports = utils;
