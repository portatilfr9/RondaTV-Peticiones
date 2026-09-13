const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');
const user = db.prepare('SELECT * FROM users WHERE username = ?').get('franziscovick_RR');
console.log(JSON.stringify(user));
