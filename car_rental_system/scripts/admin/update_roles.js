import db from "./config/db.js";

async function run() {
    try {
        console.log("Syncing roles in the database...");
        // Update role='customer' where role='user'
        const [updatedRows] = await db.User.update(
            { role: 'customer' },
            { where: { role: 'user' } }
        );
        console.log(`Successfully updated ${updatedRows} users to customers.`);
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit();
    }
}
run();
