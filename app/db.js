import Baobab from 'baobab';
const db = new Baobab({
  key: 'value',
  count: 0,
  clickers: [],
  state: {
    user: 'anonymous'
  },
});

window.db = db;
export default db;
