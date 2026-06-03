import { DataTypes, Model } from "sequelize";

export default class Rental extends Model {
    static init(sequelize) {
        return super.init(
            {
                carId: { type: DataTypes.INTEGER, allowNull: false },
                userId: { type: DataTypes.INTEGER, allowNull: false },
                carName: { type: DataTypes.STRING, allowNull: true },
                fullName: { type: DataTypes.STRING, allowNull: true },
                idNumber: { type: DataTypes.STRING, allowNull: true },
                rentalDate: { type: DataTypes.DATEONLY, allowNull: false },
                rentalDays: { type: DataTypes.INTEGER, allowNull: false },
                status: {
                    type: DataTypes.ENUM("pending", "active", "completed", "cancelled"),  // ✅ Added "pending"
                    defaultValue: "pending",  // ✅ Start as pending until payment confirmed
                },
                paymentStatus: {
                    type: DataTypes.ENUM("pending", "partial", "paid"),
                    defaultValue: "pending",
                },
                depositPaid: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                checkoutRequestId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                cost: { type: DataTypes.FLOAT, allowNull: false },
                deliveryOption: {
                    type: DataTypes.ENUM("pickup", "delivery"),
                    defaultValue: "pickup"
                },
                deliveryAddress: {
                    type: DataTypes.STRING,
                    allowNull: true
                },
                licenseNumber: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    comment: "Parsed license number from uploaded image"
                },
                ocrText: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Raw OCR text extracted from uploaded license image"
                },
                returnedDate: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                    comment: "Date when vehicle was returned by customer"
                },
                refundAmount: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                    comment: "Refund issued for early termination or partial usage"
                },
                cancellationReason: {
                    type: DataTypes.STRING(500),
                    allowNull: true,
                    comment: "Reason for cancellation/early termination"
                },
                penaltyCharged: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                    comment: "Penalty for early termination"
                },
                createdAt: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                }
            },
            {
                sequelize,
                modelName: "Rental",
                tableName: "Rentals",
                timestamps: true,
            }
        );
    }
}

