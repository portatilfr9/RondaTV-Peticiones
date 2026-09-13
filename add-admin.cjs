const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');
try {
  db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run('franziscovick_RR', 'admin123', 1);
  console.log('Admin created successfully.');
} catch (e) {
  console.error(e);
}
