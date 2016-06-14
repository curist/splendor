import Baobab from 'baobab';
const db = new Baobab({
  key: 'value',
  count: 0,
  state: {
    user: 'anonymous'
  }
});

export default db;
