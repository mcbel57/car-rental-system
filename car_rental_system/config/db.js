import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import Car from "../models/Car.js";
import User from "../models/User.js";
import Rental from "../models/Rental.js";
import Lease from "../models/Lease.js";
import Inquiry from "../models/Inquiry.js";

dotenv.config();

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
});

// ✅ Test Connection
sequelize.authenticate()
    .then(() => console.log("✅ Connected to SQLite database."))
    .catch(err => console.error("❌ Database connection error:", err));

// ✅ Initialize Models
Car.init(sequelize);
User.init(sequelize);
Rental.init(sequelize);
Lease.init(sequelize);
Inquiry(sequelize);

// ✅ Define Associations
User.hasMany(Lease, { foreignKey: "driverId", as: "Leases" });
Lease.belongsTo(User, { foreignKey: "driverId", as: "Driver" });

Car.hasMany(Lease, { foreignKey: "carId", as: "Leases" });
Lease.belongsTo(Car, { foreignKey: "carId", as: "Car" });

User.hasMany(Rental, { foreignKey: "userId", as: "Rentals" });
Rental.belongsTo(User, { foreignKey: "userId", as: "User" });

Car.hasMany(Rental, { foreignKey: "carId", as: "Rentals" });
Rental.belongsTo(Car, { foreignKey: "carId", as: "Car" });

// ✅ Export Database Object
const db = { sequelize, Sequelize, Car, User, Rental, Lease, Inquiry: sequelize.models.Inquiry };

export default db;


