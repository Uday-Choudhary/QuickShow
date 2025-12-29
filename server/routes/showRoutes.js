import express from "express";

import {
    addShow,
    getNowPlayingMovies,
    getShow,
    getShows,
    getTrailers,
    getMovieTrailer,
} from "../controllers/showController.js";

import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

/* ===================== SHOW ROUTES ===================== */
showRouter.get("/now-playing", protectAdmin, getNowPlayingMovies);
showRouter.get("/trailers", getTrailers); // New Public Route
showRouter.get("/trailer/:movieId", getMovieTrailer); // New Public Route
showRouter.post("/add", protectAdmin, addShow);
showRouter.get("/all", getShows);
showRouter.get("/:movieId", getShow);

export default showRouter;
