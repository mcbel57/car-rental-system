import { Sequelize } from "sequelize";
import PasswordResetToken from "../models/PasswordResetToken.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Car from "../models/Car.js";
import User from "../models/User.js";
import Rental from "../models/Rental.js";
import Inquiry from "../models/Inquiry.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use a single consolidated DB at the project root
const databasePath = path.join(__dirname, "..", "database.sqlite");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: databasePath,
    logging: false,
});

// ✅ Test Connection
sequelize.authenticate()
    .then(() => console.log("✅ Connected to SQLite database."))
    .catch(err => console.error("❌ Database connection error:", err));

// ✅ Initialize Models
Car.init(sequelize);
PasswordResetToken.init(sequelize);
User.init(sequelize);
Rental.init(sequelize);
const InquiryModel = Inquiry(sequelize);

// ✅ Define Associations
User.hasMany(Rental, { foreignKey: "userId", as: "Rentals" });
Rental.belongsTo(User, { foreignKey: "userId", as: "User" });

Car.hasMany(Rental, { foreignKey: "carId", as: "Rentals" });
Rental.belongsTo(Car, { foreignKey: "carId", as: "Car" });

// ✅ Sync function to be called after initialization
async function syncDatabase() {
    try {
        await sequelize.sync();
        console.log("✅ Database tables synced successfully");
    } catch (err) {
        console.error("❌ Database sync error:", err);
    }
}

// ✅ Export Database Object
const db = { sequelize, Sequelize, Car, User, Rental, Inquiry: InquiryModel, PasswordResetToken, syncDatabase };

export default db;


