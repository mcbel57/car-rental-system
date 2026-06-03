import Rental from "../models/Rental.js";
import Car from "../models/Car.js";
import db from "../config/db.js";

const { Sequelize } = db;
const { Op } = Sequelize;

// ✅ Get Bookings for Logged-in User (Active Only)
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.params.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Rental.findAll({ 
            where: { userId, status: { [Op.in]: ["pending", "active"] } },
            include: [{ model: Car, as: "Car", attributes: ["carName", "costPerDay", "description", "vehicleType", "color"] }],
            order: [["createdAt", "DESC"]]
        });

        // Auto-complete rentals whose rental end date has already passed
        const activeBookings = [];
        for (const booking of bookings) {
            const endDate = new Date(booking.rentalDate);
            endDate.setDate(endDate.getDate() + booking.rentalDays - 1);

            if (booking.status === "active" && endDate < today) {
                await booking.update({
                    status: "completed",
                    returnedDate: endDate.toISOString().split("T")[0],
                    updatedAt: new Date()
                });
                continue;
            }

            if (endDate >= today) {
                activeBookings.push(booking);
            }
        }

        const formattedBookings = activeBookings.map(booking => ({
            ...booking.toJSON(),
            carName: booking.Car ? booking.Car.carName : booking.carName,
            costPerDay: booking.Car ? booking.Car.costPerDay : null
        }));

        res.status(200).json(formattedBookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

// 📋 Get Rental History (Completed & Cancelled)
export const getRentalHistory = async (req, res) => {
    try {
        const userId = req.params.userId;
        const history = await Rental.findAll({ 
            where: { userId, status: { [Op.in]: ["completed", "cancelled"] } },
            include: [{ model: Car, as: "Car", attributes: ["carName", "costPerDay"] }],
            order: [["updatedAt", "DESC"]]
        });

        const formattedHistory = history.map(rental => ({
            ...rental.toJSON(),
            carName: rental.Car ? rental.Car.carName : rental.carName,
            costPerDay: rental.Car ? rental.Car.costPerDay : null
        }));

        res.status(200).json(formattedHistory);
    } catch (error) {
        console.error("Error fetching rental history:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

// 🧮 Calculate Refund for Early Termination
// 30% penalty if cancelled within 24 hours, 10% for early return
const calculateRefund = (totalCost, depositPaid, daysUsed, totalDays) => {
    const refundBasisPerDay = totalCost / totalDays;
    const amountUsed = daysUsed * refundBasisPerDay;
    
    let penalty = 0;
    if (daysUsed === 0) {
        // Cancelled before rental started (within 24 hours)
        penalty = totalCost * 0.30;  // 30% penalty
    } else if (daysUsed < totalDays) {
        // Early return
        penalty = (totalCost - amountUsed) * 0.10;  // 10% penalty on unused portion
    }
    
    const refundable = depositPaid - penalty;
    return {
        refundAmount: Math.max(refundable, 0),
        penaltyCharged: Math.min(penalty, depositPaid)
    };
};

// ✅ Complete Rental (Mark as completed when vehicle is returned)
export const completeRental = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { returnedDate } = req.body;

        const rental = await Rental.findByPk(bookingId);
        if (!rental) return res.status(404).json({ message: "Rental not found." });

        // Calculate days used
        const rentalStart = new Date(rental.rentalDate);
        const returnDate = new Date(returnedDate || new Date());
        const daysUsed = Math.floor((returnDate - rentalStart) / (1000 * 60 * 60 * 24)) + 1;

        await rental.update({
            status: "completed",
            returnedDate: returnedDate || new Date().toISOString().split('T')[0],
            updatedAt: new Date()
        });

        res.status(200).json({ 
            message: "Rental completed successfully.",
            rental: rental.toJSON()
        });
    } catch (error) {
        console.error("Error completing rental:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

// 🗑️ Cancel/Terminate Booking (Mark as cancelled instead of deleting)
export const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;

        const rental = await Rental.findByPk(bookingId);
        if (!rental) return res.status(404).json({ message: "Booking not found." });

        // Calculate refund if payment was made
        let refundData = { refundAmount: 0, penaltyCharged: 0 };
        if (rental.paymentStatus === 'paid') {
            const daysUsed = rental.status === "active" ? 1 : 0;
            refundData = calculateRefund(rental.cost, rental.depositPaid, daysUsed, rental.rentalDays);
        }

        await rental.update({
            status: "cancelled",
            cancellationReason: reason || "User terminated booking",
            refundAmount: refundData.refundAmount,
            penaltyCharged: refundData.penaltyCharged,
            updatedAt: new Date()
        });

        res.status(200).json({ 
            message: "Booking cancelled successfully.",
            refund: refundData
        });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

