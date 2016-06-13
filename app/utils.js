var m = require('mithril');
var db = require('app/db');

var utils = {};

// bind data to mithril controller
utils.BindData = function(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(function(propName) {
    var path = bindings[propName];
    var v = db.get(path);
    controller.data[propName] = v;
  });

  var watcher = controller._w = db.watch(bindings);
  watcher.on('update', function(e) {
    var data = e.target.get();
    controller.data = data;
    m.redraw();
  });
}

module.exports = utils;
