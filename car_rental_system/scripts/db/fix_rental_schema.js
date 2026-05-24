import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('config/database.sqlite', (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

const table = 'Rentals';

db.all(`PRAGMA table_info(${table})`, (err, rows) => {
  if (err) {
    console.error('Failed to read table info:', err.message);
    db.close();
    process.exit(1);
  }

  const columns = rows.map(c => c.name);
  const alterations = [];

  if (!columns.includes('checkoutRequestId')) {
    alterations.push(`ALTER TABLE ${table} ADD COLUMN checkoutRequestId TEXT`);
  }
  if (!columns.includes('deliveryOption')) {
    alterations.push(`ALTER TABLE ${table} ADD COLUMN deliveryOption TEXT DEFAULT 'pickup'`);
  }
  if (!columns.includes('deliveryAddress')) {
    alterations.push(`ALTER TABLE ${table} ADD COLUMN deliveryAddress TEXT`);
  }

  if (alterations.length === 0) {
    console.log('No schema changes needed.');
    db.close();
    return;
  }

  const runAlter = (index) => {
    if (index >= alterations.length) {
      console.log('Schema patched successfully.');
      db.close();
      return;
    }

    const sql = alterations[index];
    console.log('Running:', sql);
    db.run(sql, (err) => {
      if (err) {
        console.error('Failed to run:', sql, err.message);
        db.close();
        process.exit(1);
      }
      runAlter(index + 1);
    });
  };

  runAlter(0);
});
