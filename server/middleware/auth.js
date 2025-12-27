import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        /* Clerk attaches auth via a function */
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await clerkClient.users.getUser(userId);

        if (user?.privateMetadata?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
