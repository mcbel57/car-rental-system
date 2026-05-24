import db from "./config/db.js";

const checkSchema = async () => {
    try {
        const [results, metadata] = await db.sequelize.query("PRAGMA table_info(Users);");
        console.log("Users Table Schema:");
        console.table(results);

        const users = await db.User.findAll({ attributes: ['id', 'email', 'role', 'driverStatus'] });
        console.log("\nCurrent Users:");
        console.table(users.map(u => u.toJSON()));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkSchema();
