var B = require('app/broker');
var db = require('app/db');

B.on('change-name', function(action) {
  db.set(['state', 'user'], action.name);
})
