import db from "./config/db.js";

async function checkData() {
    try {
        await db.sequelize.authenticate();
        
        const carCount = await db.Car.count();
        const userCount = await db.User.count();
        const rentalCount = await db.Rental.count();
        
        console.log(`\n📊 DATABASE CONTENTS:`);
        console.log(`   Cars: ${carCount}`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Rentals: ${rentalCount}\n`);
        
        const cars = await db.Car.findAll({ attributes: ['id', 'carName', 'costPerDay'] });
        console.log(`🚗 CARS IN SYSTEM:`);
        cars.forEach(car => console.log(`   ${car.id}. ${car.carName} - $${car.costPerDay}/day`));
        
        const users = await db.User.findAll({ attributes: ['id', 'firstName', 'lastName', 'email', 'role'] });
        console.log(`\n👥 USERS IN SYSTEM:`);
        users.forEach(user => console.log(`   ${user.id}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`));
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkData();
