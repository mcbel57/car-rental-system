
import db from "./config/db.js";

const emailToDelete = process.argv[2];

if (!emailToDelete) {
    console.error("❌ Please provide an email address: node delete_user.js <email>");
    process.exit(1);
}

async function deleteUser() {
    try {
        console.log(`🔍 Searching for user: ${emailToDelete}...`);
        
        const user = await db.User.findOne({ where: { email: emailToDelete } });
        
        if (!user) {
            console.error("❌ User not found.");
            process.exit(1);
        }

        console.log(`⚠️  User Found: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log("🚀 Starting deletion process...");

        // 1. Delete Rentals
        const rentalsDeleted = await db.Rental.destroy({ where: { userId: user.id } });
        console.log(`✅ Deleted ${rentalsDeleted} rental records.`);

        // 2. (leases removed) — lease records handling removed

        // 3. Delete Inquiries (matching by email)
        const inquiriesDeleted = await db.Inquiry.destroy({ where: { email: user.email } });
        console.log(`✅ Deleted ${inquiriesDeleted} inquiry records.`);

        // 4. Delete the User
        await user.destroy();
        console.log(`✅ User ${user.email} successfully removed from the database.`);

        console.log("✨ All user info has been wiped.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during deletion:", error);
        process.exit(1);
    }
}

deleteUser();
