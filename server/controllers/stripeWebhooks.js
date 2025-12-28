import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhook = async (req, res) => {
    // console.log("Webhook received from Stripe");
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        // console.log("Webhook Verified. Type:", event.type);
    } catch (error) {
        console.error(`Webhook Signature Error: ${error.message}`);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Preferred event for Checkout Sessions
                const session = event.data.object;
                const { bookingId } = session.metadata || {};

                if (bookingId) {
                    // console.log(`Processing successful payment for Booking ID: ${bookingId}`);
                    await Booking.findByIdAndUpdate(bookingId, {
                        isPaid: true,
                        paymentLink: ""
                    });
                    console.log(`Booking ${bookingId} marked as paid.`);
                } else {
                    console.warn("Booking ID missing in session metadata");
                }

                // Send Confirmation Email
                await inngest.send({
                    name : "app/show.booked",
                    data: {bookingId}
                })
                break;

            case 'payment_intent.succeeded':
                // Only needed if NOT using Checkout or for other flows
                const paymentIntent = event.data.object;
                console.log(`Payment Intent Succeeded: ${paymentIntent.id}`);
                // Verify if we actually need to do anything here if checkout.session.completed handles it.
                // Usually redundant for Checkout flow.
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error("Stripe Webhook processing Error:", error);
        res.status(500).json({ received: false, error: error.message });
    }
};