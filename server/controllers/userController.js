import { clerkClient } from "@clerk/express";

import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Movie from "../models/Movies.js";

/* ===================== GET USER BOOKINGS ===================== */
export const getUserBookings = async (req, res) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { userId } = req.auth();

        const bookings = await Booking.find({ user: userId })
            .populate({
                path: "shows",
                populate: {
                    path: "movie",
                },
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== GET USER PROFILE ===================== */
export const getUserProfile = async (req, res) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { userId } = req.auth();

        const userProfile = await User.findById(userId);

        return res.status(200).json({
            success: true,
            userProfile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== UPDATE FAVORITE MOVIE ===================== */
export const updateFavorite = async (req, res) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { userId } = req.auth();
        const { movieId } = req.body;

        if (!movieId) {
            return res.status(400).json({
                success: false,
                message: "movieId is required",
            });
        }

        const user = await clerkClient.users.getUser(userId);

        const favorites = user.privateMetadata?.favorites || [];

        let updatedFavorites;

        if (favorites.includes(movieId)) {
            updatedFavorites = favorites.filter((id) => id !== movieId);
        } else {
            updatedFavorites = [...favorites, movieId];
        }

        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {
                ...user.privateMetadata,
                favorites: updatedFavorites,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Favorite movie updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== GET FAVORITE MOVIES ===================== */
export const getFavoriteMovies = async (req, res) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        const favoriteMovies = user.privateMetadata?.favorites || [];

        if (favoriteMovies.length === 0) {
            return res.status(200).json({
                success: true,
                movies: [],
            });
        }

        const movies = await Movie.find({
            _id: { $in: favoriteMovies },
        });

        return res.status(200).json({
            success: true,
            movies,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
