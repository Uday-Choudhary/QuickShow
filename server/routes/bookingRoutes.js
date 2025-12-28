import express from "express";

import {
    createBooking,
    getOccupiedSeats,
    retryPayment,
    verifyBooking, // Import verifyBooking
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

/* ===================== BOOKING ROUTES ===================== */
bookingRouter.post("/create", createBooking);
bookingRouter.post("/pay", retryPayment);
bookingRouter.post("/verify", verifyBooking); // New route for manual verification
bookingRouter.get("/seats/:showId", getOccupiedSeats);

export default bookingRouter;
