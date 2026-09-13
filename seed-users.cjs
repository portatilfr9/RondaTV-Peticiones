const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/database.sqlite');

const users = [
  ['Samel012026', 'i4fpuvteg5'],
  ['Igno012026', 'ib6xrii3r3'],
  ['Jesus012026', '4ahpf3zkaz'],
  ['DSan012026', 'yaex0fbzt1'],
  ['FlekySan022026', 'shrerlp0l2'],
  ['FlekySan012026', 'gx7iniul5n'],
  ['Slevin022026', 'pezdmyxbdr'],
  ['Slevin012026', 'iw0nrhd8yw'],
  ['JoanHA2026', 'd3eqin2nlp'],
];

const stmt = db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)');

for (const [username, password] of users) {
  try {
    stmt.run(username, password);
    console.log(`Added ${username}`);
  } catch (err) {
    console.error(`Error adding ${username}: ${err.message}`);
  }
}
