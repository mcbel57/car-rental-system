import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import Car from "../models/Car.js";
import User from "../models/User.js";
import Rental from "../models/Rental.js";

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

// ✅ Export Database Object
const db = { sequelize, Sequelize, Car, User, Rental };

export default db;


