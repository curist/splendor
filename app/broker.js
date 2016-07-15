// our central events broker
import EventEmitter from 'events';

const debug = require('debug')('app/broker');

class Broker extends EventEmitter {
  constructor () {
    super();
    this.count = 0;
  }
  do (action) {
    this.count ++;
    if(this.count > 1000) {
      debug(`WARNING: events stack over ${this.count}`);
      requestAnimationFrame(() => {
        this.emit('do', action);
      });
    } else  {
      this.emit('do', action);
    }
    this.count --;
  }
}

const B = new Broker();
export default B;

if(module.hot) {
  window.B = B;
}
