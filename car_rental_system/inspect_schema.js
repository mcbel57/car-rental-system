import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('config/database.sqlite');
const tables = ['Cars', 'Rentals', 'Users'];
for (const table of tables) {
  db.all(`PRAGMA table_info("${table}")`, (err, rows) => {
    if (err) {
      console.error(`ERROR ${table}:`, err.message);
      return;
    }
    console.log(`\nTABLE ${table}:`);
    console.log(JSON.stringify(rows, null, 2));
  });
}
db.close();
