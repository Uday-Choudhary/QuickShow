import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";
import stripe from 'stripe'


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
        const { origin } = req.headers;

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

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: showData.movie.title,
                },
                unit_amount: Math.floor(showData.showPrice * 100),
            },
            quantity: 1,
        }]

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        booking.paymentLink = session.url;
        booking.sessionId = session.id;
        await booking.save();

        return res.status(200).json({
            success: true,
            url: session.url,
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== RETRY PAYMENT ===================== */
export const retryPayment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { bookingId } = req.body;
        const { origin } = req.headers;

        const booking = await Booking.findById(bookingId).populate({
            path: "shows",
            populate: {
                path: "movie",
            },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access to this booking",
            });
        }

        if (booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: "Booking is already paid",
            });
        }

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: booking.shows.movie.title,
                },
                unit_amount: Math.floor(booking.shows.showPrice * 100),
            },
            quantity: booking.bookedSeats.length,
        }];

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        booking.paymentLink = session.url;
        booking.sessionId = session.id;
        await booking.save();

        return res.status(200).json({
            success: true,
            url: session.url,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== VERIFY BOOKING STATUS ===================== */
export const verifyBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.isPaid) {
            return res.status(200).json({ success: true, message: "Already paid", isPaid: true });
        }

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        let sessionId = booking.sessionId;

        // Fallback: If sessionId is missing, try to extract from paymentLink (legacy/failed-save scenario)
        if (!sessionId && booking.paymentLink) {
            const match = booking.paymentLink.match(/\/pay\/(cs_[a-zA-Z0-9]+)/);
            if (match) {
                sessionId = match[1];
            }
        }

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "No payment session found" });
        }

        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            booking.isPaid = true;
            booking.paymentLink = ""; // Clear link as it's paid
            await booking.save();
            return res.status(200).json({ success: true, message: "Payment verified", isPaid: true });
        }

        return res.status(200).json({ success: false, message: "Payment not completed yet", isPaid: false });

    } catch (error) {
        console.error("Verify Booking Error:", error);
        return res.status(500).json({ success: false, message: error.message });
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
