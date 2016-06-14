// our central events broker
import EventEmitter from 'events';

class Broker extends EventEmitter {
  do (action) {
    this.emit('do', action);
  }
}

const b = new Broker();

module.exports = b;
