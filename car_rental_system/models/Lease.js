import { DataTypes, Model } from "sequelize";

export default class Lease extends Model {
    static init(sequelize) {
        return super.init(
            {
                driverId: { type: DataTypes.INTEGER, allowNull: false },
                carId: { type: DataTypes.INTEGER, allowNull: false },
                startDate: { type: DataTypes.DATEONLY, allowNull: false },
                status: {
                    type: DataTypes.ENUM("pending", "active", "completed", "cancelled"),
                    allowNull: false,
                    defaultValue: "pending"
                },
                paymentStatus: {
                    type: DataTypes.ENUM("pending", "partial", "paid"),
                    defaultValue: "pending",
                },
                depositPaid: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                weeklyCost: { type: DataTypes.FLOAT, allowNull: false },
            },
            {
                sequelize,
                modelName: "Lease",
                tableName: "Leases",
                timestamps: true,
            }
        );
    }
}
