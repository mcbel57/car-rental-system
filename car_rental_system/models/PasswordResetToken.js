import { Model, DataTypes } from "sequelize";

export default class PasswordResetToken extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        tokenHash: { type: DataTypes.STRING, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        modelName: "PasswordResetToken",
        timestamps: false,
        tableName: "PasswordResetTokens",
      }
    );
  }
};
