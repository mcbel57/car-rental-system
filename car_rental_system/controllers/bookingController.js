import Rental from "../models/Rental.js";

// ✅ Get Bookings for Logged-in User
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.params.userId;
        const bookings = await Rental.findAll({ where: { userId } });

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

// 🗑️ Cancel Booking
export const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const deleted = await Rental.destroy({ where: { id: bookingId } });

        if (!deleted) return res.status(404).json({ message: "Booking not found." });

        res.status(200).json({ message: "Booking canceled successfully." });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
};

