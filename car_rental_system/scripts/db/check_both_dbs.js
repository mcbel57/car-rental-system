import sqlite3 from 'sqlite3';
import { promisify } from 'util';

async function check(path) {
  const db = new sqlite3.Database(path);
  const all = promisify(db.all.bind(db));
  try {
    const cars = await all('SELECT COUNT(*) AS count FROM Cars');
    const users = await all('SELECT COUNT(*) AS count FROM Users');
    console.log(path, cars[0].count + ' cars,', users[0].count + ' users');
  } catch (err) {
    console.error(path, 'ERROR', err.message);
  } finally {
    db.close();
  }
}

await check('config/database.sqlite');
await check('database.sqlite');
