import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

/* ===================== ADMIN CHECK ===================== */
export const isAdmin = (req, res) => {
    return res.status(200).json({
        success: true,
        isAdmin: true,
    });
};

/* ===================== DASHBOARD DATA ===================== */
export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true });

        const activeShows = await Show.find({
            showDateTime: { $gte: Date.now() },
        })
            .populate("movie")
            .sort({ showDateTime: 1 });

        const totalUsers = await User.countDocuments();

        const totalRevenue = bookings.reduce(
            (acc, booking) => acc + booking.amount,
            0
        );

        return res.status(200).json({
            success: true,
            dashboardData: {
                totalBookings: bookings.length,
                activeShows,
                totalUsers,
                totalRevenue,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== ALL SHOWS ===================== */
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({
            showDateTime: { $gte: Date.now() },
        })
            .populate("movie")
            .sort({ showDateTime: 1 });

        return res.status(200).json({
            success: true,
            shows,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== ALL BOOKINGS ===================== */
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate("user")
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
