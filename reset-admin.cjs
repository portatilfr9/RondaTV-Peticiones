const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');

try {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (user) {
    db.prepare('UPDATE users SET password = ?, is_admin = 1 WHERE username = ?').run('admin123', 'admin');
    console.log('Usuario "admin" actualizado exitosamente.');
  } else {
    db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)').run('admin', 'admin123');
    console.log('Usuario "admin" creado exitosamente.');
  }
} catch (e) {
  console.error(e);
}
