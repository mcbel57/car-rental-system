import { DataTypes, Model } from "sequelize";

export default class User extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                firstName: { type: DataTypes.STRING(50), allowNull: false },
                lastName: { type: DataTypes.STRING(50), allowNull: false },
                email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
                phoneNumber: { type: DataTypes.STRING(15), allowNull: false },
                idNumber: { type: DataTypes.STRING(9), allowNull: false, unique: true },
                password: { type: DataTypes.STRING(255), allowNull: false },
                role: {
                    type: DataTypes.ENUM("admin", "user"),
                    allowNull: false,
                    defaultValue: "user", // Default role is "user"
                },
            },
            {
                sequelize,
                modelName: "User",
                tableName: "Users",
                timestamps: true,
            }
        );
    }
}

