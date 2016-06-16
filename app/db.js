import Baobab from 'baobab';
const db = new Baobab({
  key: 'value',
  count: 0,
  clickers: [],
  state: {
    user: 'anonymous'
  }
});

export default db;
