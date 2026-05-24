import db from './config/db.js';

async function fixDatabase() {
    try {
        console.log("🛠️  Syncing User table to add missing columns...");
        
        // This will attempt to add missing columns
        await db.User.sync({ alter: true });
        
        console.log("✅ User table synced successfully.");
        
        // Final verify
        const user = await db.User.findOne();
        console.log("✅ Verification successful. Users can now log in.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Fix failed:", error.message);
        
        // If automatic sync fails (common in SQLite), we try manual ALTER
        try {
            console.log("🔄 Automatic sync failed, trying manual ALTER TABLE...");
            const queryInterface = db.sequelize.getQueryInterface();
            
            await queryInterface.addColumn('Users', 'licensePhoto', { type: db.Sequelize.STRING, allowNull: true });
            await queryInterface.addColumn('Users', 'ocrFlag', { type: db.Sequelize.ENUM('Legitimate', 'Suspicious', 'Not Found'), allowNull: true });
            await queryInterface.addColumn('Users', 'verificationNotes', { type: db.Sequelize.TEXT, allowNull: true });
            
            console.log("✅ Columns added manually.");
            process.exit(0);
        } catch (manualError) {
            console.error("❌ Manual fix also failed:", manualError.message);
            process.exit(1);
        }
    }
}

fixDatabase();
