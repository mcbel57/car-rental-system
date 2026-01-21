import db from "../config/db.js"; // ✅ Ensure MySQL connection works

const getAllRentals = (req, res) => {
    const sql = `
        SELECT rentals.id, cars.carName, users.fullName, users.idNumber, 
               rentals.rentalDate, rentals.rentalDays, rentals.cost
        FROM rentals
        JOIN cars ON rentals.carId = cars.id
        JOIN users ON rentals.userId = users.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching rentals:", err);
            return res.status(500).json({ error: "Failed to fetch rentals" });
        }
        res.status(200).json(results);
    });
};

const deleteRental = (req, res) => {
    const rentalId = req.params.id;

    const sql = "DELETE FROM rentals WHERE id = ?";
    db.query(sql, [rentalId], (err, result) => {
        if (err) {
            console.error("Error deleting rental:", err);
            return res.status(500).json({ error: "Failed to delete rental" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Rental not found" });
        }
        res.status(200).json({ message: "Rental deleted successfully" });
    });
};

// ✅ Export the functions correctly
export default { getAllRentals, deleteRental };
