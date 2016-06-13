var Baobab = require('baobab');
var db = new Baobab({
  key: 'value',
  count: 0,
  state: {
    user: 'anonymous'
  }
});

module.exports = db;
