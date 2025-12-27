import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware, serve } from "@clerk/express";

import connectDB from "./config/db.js";
import { functions, inngest } from "./inngest/index.js";

import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

await connectDB();


app.get("/", (req, res) => {
  res.send("Server is live");
});


app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// API Routes
app.use("/api/shows", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
