import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";
import showRouter from "./routes/showRoutes.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

await connectDB();

app.get("/", (req, res) => res.send("Server is live"));
app.use("/api/shows", showRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
