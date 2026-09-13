const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');
const users = db.prepare('SELECT username, password FROM users WHERE is_admin = 1').all();
console.log(JSON.stringify(users));
