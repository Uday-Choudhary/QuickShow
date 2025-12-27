import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";
import {serve} from '@clerk/express';
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

await connectDB();

//API Routes
app.get("/", (req, res) => res.send("Server is live"));
app.use('/api/inngest' , serve({client : inngest , functions}))
app.use("/api/shows", showRouter);
app.use("/api/booking", bookingRouter)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
