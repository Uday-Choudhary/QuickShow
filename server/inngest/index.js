import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import connectDB from "../config/db.js";
import sendEmail from "../config/nodeMailer.js";

export const inngest = new Inngest({
    id: "movie-ticket-booking",
});

/* ===================== USER CREATED ===================== */
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        try {
            await connectDB();

            console.log("[Inngest] sync-user-from-clerk received data:", JSON.stringify(event.data, null, 2));

            const userData = event.data.data || event.data;
            const {
                id,
                first_name,
                last_name,
                email_addresses,
                image_url,
            } = userData || {};

            if (!email_addresses?.length) {
                console.log("Inngest: sync-user-from-clerk skipped - no email. Data:", userData);
                return;
            }

            try {
                await User.create({
                    _id: id,
                    email: email_addresses[0].email_address,
                    name: `${first_name || ""} ${last_name || ""}`.trim(),
                    image: image_url,
                });
                console.log("Inngest: sync-user-from-clerk completed for ID:", id);
                return { success: true, id };
            } catch (error) {
                if (error.code === 11000) {
                    console.log("Inngest: User already exists (duplicate key), skipping creation.");
                    return { success: true, message: "User exists" };
                }
                throw error;
            }
        } catch (error) {
            console.error("Inngest: sync-user-from-clerk failed", error);
            return { success: false, error: error.message };
        }
    }
);

/* ===================== USER DELETED ===================== */
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-from-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        try {
            await connectDB();
            console.log("[Inngest] delete-user-from-clerk received data:", JSON.stringify(event.data, null, 2));

            const userData = event.data.data || event.data;
            const { id } = userData || {};

            if (!id) {
                console.log("Inngest: delete-user-from-clerk skipped - no ID found");
                return;
            }

            await User.findByIdAndDelete(id);
            console.log("Inngest: delete-user-from-clerk completed for ID:", id);
            return { success: true, id };
        } catch (error) {
            console.error("Inngest: delete-user-from-clerk failed", error);
            return { success: false, error: error.message };
        }
    }
);

/* ===================== USER UPDATED ===================== */
const syncUserUpdate = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        try {
            await connectDB();
            console.log("[Inngest] update-user-from-clerk received data:", JSON.stringify(event.data, null, 2));

            const userData = event.data.data || event.data;
            const {
                id,
                first_name,
                last_name,
                email_addresses,
                image_url,
            } = userData || {};

            if (!email_addresses?.length) {
                console.log("Inngest: update-user-from-clerk skipped - no email");
                return;
            }

            await User.findByIdAndUpdate(
                id,
                {
                    email: email_addresses[0].email_address,
                    name: `${first_name || ""} ${last_name || ""}`.trim(),
                    image: image_url,
                },
                { new: true, upsert: true }
            );
            console.log("Inngest: update-user-from-clerk completed for ID:", id);
            return { success: true, id };
        } catch (error) {
            console.error("Inngest: update-user-from-clerk failed", error);
            return { success: false, error: error.message };
        }
    }
);

/* ===================== RELEASE UNPAID BOOKING ===================== */
const releaseUnpaidBooking = inngest.createFunction(
    { id: "release-unpaid-booking" },
    { event: "booking.created" },
    async ({ event, step }) => {
        const { bookingId } = event.data;
        console.log(`[Inngest] release-unpaid-booking started for bookingId: ${bookingId}`);

        // 1. Wait for payment window
        await step.sleep("wait-for-payment", "7m");

        // 2. Check Booking Status
        const booking = await step.run("check-payment-status", async () => {
            const bookingDoc = await Booking.findById(bookingId);
            return bookingDoc ? bookingDoc.toObject() : null;
        });

        if (!booking || booking.isPaid) {
            console.log(`[Inngest] Booking ${bookingId} paid or not found - No action needed.`);
            return { message: "Booking paid or not found - No action needed" };
        }

        console.log(`[Inngest] Booking ${bookingId} is unpaid. Proceeding to release seats...`);

        // 3. Release Seats if Unpaid
        await step.run("release-seats", async () => {
            try {
                // Note: Using 'booking.shows' based on your provided code
                const show = await Show.findById(booking.shows);
                if (!show) {
                    console.error(`[Inngest] Show not found for booking ${bookingId}`);
                    return;
                }

                const updateOperation = { $unset: {} };
                booking.bookedSeats.forEach((seat) => {
                    updateOperation.$unset[`occupiedSeats.${seat}`] = "";
                });

                await Show.findByIdAndUpdate(booking.shows, updateOperation, { new: true });

                // 4. Mark Booking as Cancelled
                await Booking.findByIdAndUpdate(bookingId, {
                    status: "Cancelled",
                    isPaid: false
                });
                console.log(`[Inngest] Booking ${bookingId} marked as Cancelled`);
            } catch (error) {
                console.error(`[Inngest] Error executing release-seats step for booking ${bookingId}:`, error);
                throw error;
            }
        });

        return { message: "Booking cancelled and seats released" };
    }
);

/* ===================== SEND BOOKING CONFIRMATION ===================== */
const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "app/show.booked" },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        // Step 1: Fetch Booking Data
        // We use step.run so if email fails, we don't re-query DB on retry
        const booking = await step.run("fetch-booking-details", async () => {
            await connectDB();

            // Note: I used 'shows' here to match your 'releaseUnpaidBooking' logic.
            // If your Schema field is actually 'show', change 'path: "shows"' to 'path: "show"'
            const bookingDoc = await Booking.findById(bookingId)
                .populate({
                    path: "shows",
                    populate: {
                        path: "movie",
                        model: "Movie"
                    }
                })
                .populate("user");

            if (!bookingDoc) throw new Error(`Booking not found: ${bookingId}`);

            // Convert to JSON to remove Mongoose methods for Inngest state
            return JSON.parse(JSON.stringify(bookingDoc));
        });

        if (!booking || !booking.user || !booking.user.email) {
            console.error("[Inngest] Cannot send email. Missing booking or user email.");
            return { success: false, message: "Data missing" };
        }

        // Step 2: Send Email
        await step.run("send-confirmation-email", async () => {
            // Check if population worked correctly
            const movieTitle = booking.shows?.movie?.title || "Unknown Movie";
            const showTime = booking.shows?.startTime || "N/A";

            await sendEmail({
                to: booking.user.email,
                subject: `Payment Confirmation for ${movieTitle}`,
                html: `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">

            <div style="background-color: #FF3E41; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                <p style="color: #ffe0e0; margin: 5px 0 0;">Get your popcorn ready 🍿</p>
            </div>

            <div style="padding: 30px;">
                <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">
                    Hello, your tickets for <strong style="color: #FF3E41; font-size: 18px;">${movieTitle}</strong> are confirmed.
                </p>

                <div style="background-color: #f9f9f9; border: 2px dashed #e0e0e0; border-radius: 8px; padding: 20px;">
                    
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <span style="color: #777;">Booking ID</span>
                        <strong style="color: #333;">${booking._id}</strong>
                    </div>

                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <span style="color: #777;">Date</span>
                        <strong style="color: #333;">${new Date(booking.createdAt).toDateString()}</strong>
                    </div>

                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <span style="color: #777;">Time</span>
                        <strong style="color: #333;">${showTime}</strong>
                    </div>

                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <span style="color: #777;">Seats</span>
                        <strong style="color: #333;">${booking.bookedSeats.join(', ')}</strong>
                    </div>

                    <div style="display: flex; justify-content: space-between; padding-top: 5px;">
                        <span style="color: #777;">Total Amount</span>
                        <strong style="color: #28a745; font-size: 18px;">₹${booking.totalAmount}</strong>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">Please show this email at the cinema entrance.</p>
                </div>
            </div>

            <div style="background-color: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Movie Ticket Booking App</p>
            </div>
        </div>
    </div>
                `
            });
            console.log(`[Inngest] Confirmation email sent to ${booking.user.email}`);
        });

        return { success: true, bookingId };
    }
);

// Export all functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
    releaseUnpaidBooking,
    sendBookingConfirmationEmail,
];