import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import connectDB from "../config/db.js";

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

            // Handle both raw Webhook payload (event.data.data) and direct payload (event.data)
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
                // Ignore duplicate key errors (idempotency)
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
                { new: true, upsert: true } // Changed upsert: false to true to ensure user exists
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

        // 1. Wait for payment window (e.g., 5 seconds for testing, usually 5m)
        await step.sleep("wait-for-payment", "7m");

        // 2. Check Booking Status
        const booking = await step.run("check-payment-status", async () => {
            const bookingDoc = await Booking.findById(bookingId);
            // Return a plain object, NOT a Mongoose document
            return bookingDoc ? bookingDoc.toObject() : null;
        });

        // Use optional chaining for safety - booking might be null if manually deleted
        if (!booking || booking.isPaid) {
            console.log(`[Inngest] Booking ${bookingId} paid or not found - No action needed. Found: ${!!booking}, isPaid: ${booking?.isPaid}`);
            return { message: "Booking paid or not found - No action needed" };
        }

        console.log(`[Inngest] Booking ${bookingId} is unpaid. Proceeding to release seats...`);

        // 3. Release Seats if Unpaid
        await step.run("release-seats", async () => {
            try {
                const show = await Show.findById(booking.shows);
                if (!show) {
                    console.error(`[Inngest] Show not found for booking ${bookingId}. Show ID: ${booking.shows}`);
                    return;
                }

                console.log(`[Inngest] Releasing seats for Show ${show._id}. Seats to release: ${booking.bookedSeats.join(', ')}`);

                // Construct $unset update to remove specific seats from the Map
                const updateOperation = { $unset: {} };
                booking.bookedSeats.forEach((seat) => {
                    updateOperation.$unset[`occupiedSeats.${seat}`] = "";
                });

                const updatedShow = await Show.findByIdAndUpdate(booking.shows, updateOperation, { new: true });
                console.log(`[Inngest] Seats released for Show ${show._id}. Updated occupiedSeats keys: ${Object.keys(updatedShow.occupiedSeats || {}).join(', ')}`);

                // 4. Mark Booking as Cancelled
                await Booking.findByIdAndUpdate(bookingId, {
                    status: "Cancelled",
                    // Ensure isPaid is false (redundant but safe)
                    isPaid: false
                });
                console.log(`[Inngest] Booking ${bookingId} marked as Cancelled`);
            } catch (error) {
                console.error(`[Inngest] Error executing release-seats step for booking ${bookingId}:`, error);
                throw error; // Re-throw to ensure Inngest records the failure
            }
        });

        return { message: "Booking cancelled and seats released" };
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
    releaseUnpaidBooking,
];
