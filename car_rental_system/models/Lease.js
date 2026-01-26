import { DataTypes, Model } from "sequelize";

export default class Lease extends Model {
    static init(sequelize) {
        return super.init(
            {
                driverId: { type: DataTypes.INTEGER, allowNull: false },
                carId: { type: DataTypes.INTEGER, allowNull: false },
                startDate: { type: DataTypes.DATEONLY, allowNull: false },
                status: {
                    type: DataTypes.ENUM("pending", "active", "ended", "terminated"),
                    allowNull: false,
                    defaultValue: "pending"
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
