var m = require('mithril');
var db = require('app/db');

var utils = {};

// bind data to mithril controller
utils.BindData = function(controller, bindings) {
  controller.data = {};

  // get initial props value
  Object.keys(bindings).forEach(function(propName) {
    var path = bindings[propName];
    var plural = /s$/.test(propName);
    var v = db.get(path);
    controller.data[propName] = (v !== undefined)
      ? v
      : (plural ? [] : {});
  });

  var watcher = controller._w = db.watch(bindings);
  watcher.on('update', function(e) {
    var data = e.target.get();
    Object.keys(data).forEach(function(k) {
      var plural = /s$/.test(k);
      if(data[k] === undefined) {
        data[k] = (plural ? [] : {});
      }
    });
    controller.data = data;
    m.redraw();
  });
}

module.exports = utils;
