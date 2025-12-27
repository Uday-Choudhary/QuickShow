import Show from "../models/Show.js";
import Booking from "../models/Booking.js";

/* ===================== SEAT AVAILABILITY ===================== */
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);

        if (!showData) {
            return false;
        }

        const occupiedSeats = showData.occupiedSeats || {};

        const isAnySeatOccupied = selectedSeats.some(
            (seat) => occupiedSeats[seat]
        );

        return !isAnySeatOccupied;
    } catch (error) {
        return false;
    }
};

/* ===================== CREATE BOOKING ===================== */
export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;

        if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking data",
            });
        }

        /* Check seat availability */
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Selected seats are not available",
            });
        }

        /* Get show details */
        const showData = await Show.findById(showId).populate("movie");

        if (!showData) {
            return res.status(404).json({
                success: false,
                message: "Show not found",
            });
        }

        /* Create booking */
        const booking = await Booking.create({
            user: userId,
            shows: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
            isPaid: false,
        });

        /* Mark seats as occupied */
        selectedSeats.forEach((seat) => {
            showData.occupiedSeats[seat] = userId;
        });

        showData.markModified("occupiedSeats");
        await showData.save();

        // Stripe payment initialization goes here

        return res.status(200).json({
            success: true,
            message: "Booked successfully",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== OCCUPIED SEATS ===================== */
export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;

        const showData = await Show.findById(showId);

        if (!showData) {
            return res.status(404).json({
                success: false,
                message: "Show not found",
            });
        }

        const occupiedSeats = Object.keys(showData.occupiedSeats || {});

        return res.status(200).json({
            success: true,
            occupiedSeats,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
