const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');
const users = db.prepare('SELECT username, password, is_admin FROM users').all();
console.log(JSON.stringify(users));
