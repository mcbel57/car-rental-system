import db from './config/db.js';
const users = await db.User.findAll({where: {role: 'admin'}});
console.log(users.map(u => ({id: u.id, email: u.email})));
process.exit();
