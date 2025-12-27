import express from "express";

import {
    getUserBookings,
    getUserProfile,
    updateFavorite,
    getFavoriteMovies,
} from "../controllers/userController.js";

const userRouter = express.Router();

/* ===================== USER ROUTES ===================== */
userRouter.get("/bookings", getUserBookings);
userRouter.get("/profile", getUserProfile);
userRouter.post("/update-favorite", updateFavorite);
userRouter.get("/favourites", getFavoriteMovies);

export default userRouter;
