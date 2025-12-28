import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import connectDB from "./config/db.js";
import { functions, inngest } from "./inngest/index.js";

import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhook } from "./controllers/stripeWebhooks.js";

const app = express();
const PORT = process.env.PORT || 3000;


app.use(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);// =========================================================
// 2. MIDDLEWARES
// =========================================================
app.use(express.json());  
app.use(cors());
app.use(clerkMiddleware());

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// =========================================================
// 3. API ROUTES
// =========================================================
app.get("/", (req, res) => {
  res.send("Server is live");
});

app.use("/api/shows", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// Server Startup Function
const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();