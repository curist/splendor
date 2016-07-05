// our central events broker
import EventEmitter from 'events';

class Broker extends EventEmitter {
  do (action) {
    this.emit('do', action);
  }
}

const B = new Broker();
export default B;

if(module.hot) {
  window.B = B;
}
