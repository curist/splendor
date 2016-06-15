import m from 'mithril';

function init(el, inited) {
  if(inited) {
    return;
  }
  componentHandler.upgradeElement(el);
}

const Button = {
  view (ctrl, args, tag) {
    const options = {
      ripple: 'mdl-js-ripple-effect',
      raised: 'mdl-button--raised',
      accent: 'mdl-button--accent',
      colored: 'mdl-button--colored',
      fab: 'mdl-button--fab',
    };
    var className = Object.keys(options).filter(function(option) {
      return (args.config || {})[option];
    }).map(function(option) {
      return options[option];
    }).join(' ');

    let config = Object.assign({
      config: init,
      className,
    }, args);
    return m('button.mdl-button.mdl-js-button', config, tag);
  }
}

export default Button;
