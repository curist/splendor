// our central events broker
var EventEmitter = require('events');
var util = require('util');

function Broker() {
  EventEmitter.call(this);
}
util.inherits(Broker, EventEmitter);

Broker.prototype.do = function(action) {
  this.emit('do', action);
}

var b = new Broker();

module.exports = b;
