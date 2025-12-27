import express from "express";
import { addShow, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/now-playing", protectAdmin, getNowPlayingMovies);
router.post("/add", protectAdmin, addShow);
router.get("/all", getShows)
router.get("/:movieId", getShow)

export default router;
    