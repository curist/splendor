import { Neuron, Layer, Network, Trainer, Architect } from 'synaptic';

function parse(s) {
  try {
    return JSON.parse(s);
  } catch(e) {
    return {};
  }
}

class Model {
  constructor () {
    this.modelKey = 'weeping-doll';
    this.importModel();
  }

  importModel () {
    const key = this.modelKey;
    const data = localStorage.getItem(key);
    if(data) {
      const model = parse(data);
      this.net = Network.fromJSON(model);
    } else {
      this.net = new Architect.Perceptron(242, 60, 1);
    }
  }

  exportModel () {
    const key = this.modelKey;
    const model = this.net.toJSON();
    localStorage.setItem(key, JSON.stringify(model));
  }
}

const model = new Model();
export default model;
