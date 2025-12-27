import express from "express";

import {
    createBooking,
    getOccupiedSeats,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

/* ===================== BOOKING ROUTES ===================== */
bookingRouter.post("/create", createBooking);
bookingRouter.get("/seats/:showId", getOccupiedSeats);

export default bookingRouter;
