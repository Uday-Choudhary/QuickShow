import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

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

        /* 1. ATOMIC CHECK & UPDATE: Find Show AND ensure seats are not taken */
        // Fix: existing documents might have occupiedSeats as Array, which crashes $set logic
        // We need to sanitise it first if it's an array.
        let showDoc = await Show.findById(showId);
        if (!showDoc) {
            return res.status(404).json({
                success: false,
                message: "Show not found",
            });
        }

        // Data Sanitization: Convert Array to Object if needed, or init if undefined
        if (!showDoc.occupiedSeats || Array.isArray(showDoc.occupiedSeats)) {
            const newOccupiedSeats = {};
            if (Array.isArray(showDoc.occupiedSeats)) {
                showDoc.occupiedSeats.forEach(seat => {
                    // Assume legacy string array implies occupied by SOMEONE
                    if (typeof seat === 'string') newOccupiedSeats[seat] = "legacy_user";
                });
            }
            showDoc.occupiedSeats = newOccupiedSeats;
            // Mark as modified to ensure Mongoose saves the Mixed type change
            showDoc.markModified('occupiedSeats');
            await showDoc.save();
        }

        const query = { _id: showId };
        const update = { $set: {} };

        // Ensure none of the selected seats exist in occupiedSeats
        selectedSeats.forEach((seat) => {
            query[`occupiedSeats.${seat}`] = { $exists: false };
            update.$set[`occupiedSeats.${seat}`] = userId;
        });

        console.log(`[createBooking] Attempting atomic update. Show: ${showId}, Seats: ${selectedSeats.join(', ')}`);
        // console.log(`[createBooking] Query:`, JSON.stringify(query));

        // Try to update atomically
        const showData = await Show.findOneAndUpdate(query, update, {
            new: true, // Return updated doc
        }).populate("movie");

        if (!showData) {
            console.warn(`[createBooking] Atomic update FAILED. Seats likely already taken. Show: ${showId}`);
            return res.status(400).json({
                success: false,
                message: "One or more selected seats are already booked. Please select different seats.",
            });
        }

        console.log(`[createBooking] Atomic update SUCCESS.`);

        /* 2. Create Booking Record */
        const booking = await Booking.create({
            user: userId,
            shows: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
            isPaid: false,
        });

        /* 3. Trigger Inngest Event for Delayed Seat Release */
        await inngest.send({
            name: "booking.created",
            data: {
                bookingId: booking._id,
            },
        });

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

        let occupiedSeats = [];
        if (Array.isArray(showData.occupiedSeats)) {
            // Legacy support: if it's an array of strings
            occupiedSeats = showData.occupiedSeats;
        } else {
            // Standard: Object keys
            occupiedSeats = Object.keys(showData.occupiedSeats || {});
        }

        console.log(`[getOccupiedSeats] Show: ${showId}, Count: ${occupiedSeats.length}`, occupiedSeats);

        res.setHeader('Cache-Control', 'no-store');
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
