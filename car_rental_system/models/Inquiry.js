import { DataTypes, Model } from "sequelize";

class Inquiry extends Model {}

export default (sequelize) => {
    Inquiry.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('new', 'read', 'responded'),
            defaultValue: 'new',
        }
    }, {
        sequelize,
        modelName: "Inquiry",
        tableName: "Inquiries",
        timestamps: true,
    });

    return Inquiry;
};
