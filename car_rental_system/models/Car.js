import { DataTypes, Model } from "sequelize";

export default class Car extends Model {
    static init(sequelize) {
        return super.init(
            {
                carName: { type: DataTypes.STRING, allowNull: false },
                description: { type: DataTypes.TEXT, allowNull: false },
                color: { type: DataTypes.STRING, allowNull: false },
                vehicleType: { 
                    type: DataTypes.ENUM("FWD", "RWD", "AWD", "4WD"), 
                    allowNull: false 
                },
                costPerDay: { type: DataTypes.FLOAT, allowNull: false },
                image: { type: DataTypes.BLOB("long"), allowNull: false },
            },
            {
                sequelize, // ✅ Ensure sequelize is passed properly
                modelName: "Car",
                tableName: "Cars",
                timestamps: false, // ✅ Disable timestamps if not needed
            }
        );
    }
}
