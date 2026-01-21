import { DataTypes, Model } from "sequelize";

export default class Rental extends Model {
    static init(sequelize) {
        return super.init(
            {
                carId: { type: DataTypes.INTEGER, allowNull: false },
                userId: { type: DataTypes.INTEGER, allowNull: false },
                carName: { type: DataTypes.STRING, allowNull: false },
                fullName: { type: DataTypes.STRING, allowNull: false },
                idNumber: { type: DataTypes.STRING, allowNull: false },
                rentalDate: { type: DataTypes.DATEONLY, allowNull: false },
                rentalDays: { type: DataTypes.INTEGER, allowNull: false },
                cost: { type: DataTypes.FLOAT, allowNull: false },
            },
            {
                sequelize,
                modelName: "Rental",
                tableName: "Rentals",
                timestamps: false,
            }
        );
    }
}

