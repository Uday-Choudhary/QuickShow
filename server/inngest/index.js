import { Inngest, step } from "inngest";
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
            const { id, first_name, last_name, email_addresses, image_url } = userData || {};

            if (!email_addresses?.length) {
                console.log("Inngest: sync-user-from-clerk skipped - no email.");
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
            const userData = event.data.data || event.data;
            const { id } = userData || {};

            if (!id) return;

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
            const userData = event.data.data || event.data;
            const { id, first_name, last_name, email_addresses, image_url } = userData || {};

            if (!email_addresses?.length) return;

            await User.findByIdAndUpdate(
                id,
                {
                    email: email_addresses[0].email_address,
                    name: `${first_name || ""} ${last_name || ""}`.trim(),
                    image: image_url,
                },
                { new: true, upsert: true }
            );
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
                // Using 'shows' based on your Schema
                const showId = booking.shows;

                const updateOperation = { $unset: {} };
                booking.bookedSeats.forEach((seat) => {
                    updateOperation.$unset[`occupiedSeats.${seat}`] = "";
                });

                await Show.findByIdAndUpdate(showId, updateOperation, { new: true });

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
        const booking = await step.run("fetch-booking-details", async () => {
            await connectDB();
            const bookingDoc = await Booking.findById(bookingId)
                .populate({
                    path: "shows",
                    populate: { path: "movie", model: "Movie" }
                })
                .populate("user");

            if (!bookingDoc) throw new Error("Booking not found");
            return JSON.parse(JSON.stringify(bookingDoc));
        });

        if (!booking?.user?.email) return { success: false, message: "No email found" };

        // Step 2: Send Email with TABLE Layout
        await step.run("send-confirmation-email", async () => {
            const movieTitle = booking.shows?.movie?.title || "Movie Ticket";
            // Check showDateTime (common name) or startTime
            const showDateRaw = booking.shows?.showDateTime || booking.shows?.startTime;
            const showDate = showDateRaw ? new Date(showDateRaw).toDateString() : "Date N/A";
            const showTime = showDateRaw ? new Date(showDateRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time N/A";

            // FIX: Ensure amount falls back to 0 if undefined
            const amount = booking.amount !== undefined ? booking.amount : "0";

            await sendEmail({
                to: booking.user.email,
                subject: `Booking Confirmed: ${movieTitle}`,
                html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                        
                        <div style="background-color: #E11D48; padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Booking Confirmed!</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Get your popcorn ready 🍿</p>
                        </div>

                        <div style="padding: 30px;">
                            <p style="font-size: 16px; line-height: 1.5; color: #333; text-align: center; margin-bottom: 25px;">
                                Hello, your tickets for <strong style="color: #E11D48;">${movieTitle}</strong> are successfully booked.
                            </p>

                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Booking ID</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right; font-size: 14px;">${booking._id}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Date</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right; font-size: 14px;">${showDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Time</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right; font-size: 14px;">${showTime}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Seats</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right; font-size: 14px;">${booking.bookedSeats.join(', ')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 15px 0 0; color: #64748b; font-size: 16px; font-weight: 600;">Total Amount</td>
                                        <td style="padding: 15px 0 0; color: #16a34a; font-weight: 700; text-align: right; font-size: 18px;">₹${amount}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Please show this email at the cinema entrance.</p>
                            </div>
                        </div>

                        <div style="background-color: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} QuickShow. All rights reserved.</p>
                        </div>
                    </div>
                </div>
                `
            });
            console.log(`[Inngest] Email sent to ${booking.user.email}`);
        });

        return { success: true, bookingId };
    }
);

export const sendShowReminderEmail = inngest.createFunction(
    { id: "send-show-reminder-email" },
    // Run every hour at minute 0 (e.g., 1:00, 2:00)
    // Checking a 1-hour window ensures every show gets caught exactly once.
    { cron: "0 * * * *" },
    async ({ step }) => {
        // 1. Ensure DB Connection
        await connectDB();

        // 2. Define Time Window
        // We look for shows starting between 8 hours and 9 hours from now
        const now = new Date();
        const windowStart = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Now + 8h
        const windowEnd = new Date(now.getTime() + (9 * 60 * 60 * 1000));   // Now + 9h

        // Step 1: Find Shows and Prepare Tasks
        const reminderTasks = await step.run('prepare-reminder-tasks', async () => {
            const shows = await Show.find({
                showDateTime: { // Assuming 'showDateTime' is your schema field
                    $gte: windowStart,
                    $lt: windowEnd
                }
            }).populate('movie');

            const tasks = [];

            for (const show of shows) {
                if (!show.movie || !show.occupiedSeats) continue;

                // Extract User IDs (Values of the occupiedSeats map)
                // occupiedSeats structure: { "A1": "userId123", "A2": "userId123" }
                const userIds = [...new Set(Object.values(show.occupiedSeats))];

                if (userIds.length === 0) continue;

                // Fetch User Details
                const users = await User.find({ _id: { $in: userIds } }).select("name email");

                // Format friendly time
                const formattedTime = new Date(show.showDateTime).toLocaleString('en-US', {
                    weekday: 'short', hour: '2-digit', minute: '2-digit'
                });

                for (const user of users) {
                    tasks.push({
                        userEmail: user.email,
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showTime: formattedTime,
                        screen: show.screen || "Main Screen"
                    });
                }
            }
            return tasks;
        });

        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No shows starting in the target window (8h-9h from now)." };
        }

        // Step 2: Send Emails
        const result = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `🎬 Reminder: "${task.movieTitle}" starts in 8 hours!`,
                    html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #E11D48;">Movie Reminder</h2>
                        <p>Hi <strong>${task.userName}</strong>,</p>
                        <p>This is a reminder that your movie is starting in approximately 8 hours.</p>
                        
                        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Movie:</strong> ${task.movieTitle}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${task.showTime}</p>
                            <p style="margin: 5px 0;"><strong>Screen:</strong> ${task.screen}</p>
                        </div>

                        <p>Please arrive 15 minutes early to grab your snacks! 🍿</p>
                        <p style="font-size: 12px; color: #888;">QuickShow Team</p>
                    </div>
                    `
                }))
            );
        });

        const sentCount = result.filter(r => r.status === 'fulfilled').length;
        const failedCount = result.length - sentCount;

        return {
            sent: sentCount,
            failed: failedCount,
            message: `Processed ${reminderTasks.length} reminders.`
        };
    }
);

export const sendNewShowNotifications = inngest.createFunction(
    { id: "send-new-show-notifications" },
    { event: "app/show.added" },
    async ({ event, step }) => {

        // 1. Fetch all users (lean query)
        const users = await step.run('fetch-all-users', async () => {
            await connectDB();
            // Only fetch fields we actually need
            return await User.find({}).select("name email");
        });

        if (!users || users.length === 0) {
            return { message: "No users found to notify." };
        }

        const { movieTitle, movieId } = event.data;

        // 2. Send Emails in Parallel
        const result = await step.run('broadcast-emails', async () => {
            // Use Promise.allSettled to ensure one failure doesn't stop the whole batch
            const emailPromises = users.map(user =>
                sendEmail({
                    to: user.email,
                    subject: `🎬 New Show Added: ${movieTitle}`,
                    html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9f9f9;">
                        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                            <h2 style="color: #E11D48; margin-top: 0;">New Movie Alert! 🍿</h2>
                            <p>Hi <strong>${user.name}</strong>,</p>
                            <p>Great news! A new show for <strong>"${movieTitle}"</strong> has just been added to our cinema.</p>
                            <p>Tickets are selling fast. Book your seats now to get the best view!</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/movie/${movieId}" style="background-color: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    Book Now
                                </a>
                            </div>

                            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
                                QuickShow Team • <a href="#" style="color: #888;">Unsubscribe</a>
                            </p>
                        </div>
                    </div>
                    `
                })
            );

            return await Promise.allSettled(emailPromises);
        });

        // Calculate stats
        const sentCount = result.filter(r => r.status === 'fulfilled').length;
        const failedCount = result.length - sentCount;

        return {
            message: `Notifications process completed.`,
            stats: {
                totalUsers: users.length,
                sent: sentCount,
                failed: failedCount
            }
        };
    }
);

/* ===================== EXPORT ALL FUNCTIONS ===================== */
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
    releaseUnpaidBooking,
    sendBookingConfirmationEmail,
    sendShowReminderEmail,
    sendNewShowNotifications
];