const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite', logging: false });
(async () => {
  try {
    const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'", { type: Sequelize.QueryTypes.SELECT });
    console.log('tables', tables.map(t => t.name));
    for (const t of tables) {
      const row = await sequelize.query(`SELECT count(*) AS cnt FROM "${t.name}"`, { type: Sequelize.QueryTypes.SELECT });
      console.log(t.name, row[0].cnt);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
