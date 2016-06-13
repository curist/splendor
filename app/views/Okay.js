var m = require('mithril');
var Home = require('app/views/Home');
var Foo = require('app/views/Foo');
module.exports = {
  view: function() {
    return m('div', [
      m(Home),
      m(Foo)
    ]);
  }
}
