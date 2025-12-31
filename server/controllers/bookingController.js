import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
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
        const { showId, selectedSeats, guestInfo } = req.body;
        const { origin } = req.headers;

        if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking data",
            });
        }

        /* 0. FORCE SYNC USER (Fallback if Webhook Failed) */
        const userExists = await User.exists({ _id: userId });
        if (!userExists && guestInfo && guestInfo.email) {
            console.log(`[createBooking] User ${userId} not found in DB. Syncing from guestInfo...`);
            try {
                await User.create({
                    _id: userId,
                    name: guestInfo.name || "Guest User",
                    email: guestInfo.email,
                    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestInfo.name)}`
                });
            } catch (userError) {
                console.error(`[createBooking] User sync failed:`, userError.message);
            }
        }

        /* 1. ATOMIC CHECK & UPDATE */
        // We assume occupiedSeats is a Map/Object. 
        // We build a query that ensures NONE of the requested seats exist in that object.
        const query = { _id: showId };
        const update = { $set: {} };

        selectedSeats.forEach((seat) => {
            // Check that the key "occupiedSeats.seatName" does NOT exist
            query[`occupiedSeats.${seat}`] = { $exists: false };
            // Set the value to the userId
            update.$set[`occupiedSeats.${seat}`] = userId;
        });

        console.log(`[createBooking] Attempting atomic update. Show: ${showId}, Seats: ${selectedSeats.join(', ')}`);

        const showData = await Show.findOneAndUpdate(query, update, {
            new: true,
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
            quantity: 1, // Quantity 1 for the total bundle price strategy you used
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

        // Fallback extraction
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
            booking.paymentLink = "";
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

        // Direct Object.keys call, assuming schema is always a Map now
        const occupiedSeats = Object.keys(showData.occupiedSeats || {});

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