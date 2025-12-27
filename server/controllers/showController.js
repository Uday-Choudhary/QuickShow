import axios from "axios";
import Movie from "../models/Movies.js";
import Show from "../models/Show.js";

/* ================= NOW PLAYING ================= */
export const getNowPlayingMovies = async (req, res) => {
    try {
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ message: "TMDB API key missing" });
        }

        const { data } = await axios.get(
            "https://api.themoviedb.org/3/movie/now_playing",
            {
                params: { api_key: process.env.TMDB_API_KEY },
                timeout: 10000,
            }
        );

        res.status(200).json({ success: true, movies: data.results });
    } catch (error) {
        console.error("TMDB ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= ADD SHOW ================= */
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body;

        if (
            !movieId ||
            !Array.isArray(showsInput) ||
            showsInput.length === 0 ||
            typeof showPrice !== "number"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
            });
        }

        let movie = await Movie.findById(movieId);

        /* ---------- fetch movie if not exists ---------- */
        if (!movie) {
            const [detailsRes, creditsRes] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    params: { api_key: process.env.TMDB_API_KEY },
                }),
                axios.get(
                    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
                    {
                        params: { api_key: process.env.TMDB_API_KEY },
                    }
                ),
            ]);

            movie = await Movie.create({
                _id: movieId,
                title: detailsRes.data.title,
                overview: detailsRes.data.overview,
                poster_path: detailsRes.data.poster_path,
                backdrop_path: detailsRes.data.backdrop_path,
                casts: creditsRes.data.cast,
                release_date: detailsRes.data.release_date,
                runtime: detailsRes.data.runtime,
                vote_average: detailsRes.data.vote_average,
                genres: detailsRes.data.genres,
                original_language: detailsRes.data.original_language,
                tagline: detailsRes.data.tagline || "",
            });
        }

        /* ---------- build show docs (UTC safe) ---------- */
        const showsToCreate = [];

        showsInput.forEach(({ date, time }) => {
            time.forEach(t => {
                const utcDate = new Date(`${date}T${t}:00.000Z`);

                // prevent inserting past shows
                if (utcDate >= new Date()) {
                    showsToCreate.push({
                        movie: movieId,
                        showDateTime: utcDate,
                        showPrice,
                        occupiedSeats: {},
                    });
                }
            });
        });

        if (showsToCreate.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All provided show times are in the past",
            });
        }

        await Show.insertMany(showsToCreate);

        res.status(201).json({
            success: true,
            message: "Show(s) added successfully",
        });
    } catch (error) {
        console.error("ADD SHOW ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= GET ALL SHOWS ================= */
/* returns ALL shows from today onwards */
export const getShows = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const shows = await Show.find({
            showDateTime: { $gte: startOfToday },
        })
            .populate("movie")
            .sort({ showDateTime: 1 });

        res.status(200).json({
            success: true,
            shows,
        });
    } catch (error) {
        console.error("GET SHOWS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= GET SINGLE MOVIE SHOWS ================= */
/* grouped by date */
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const shows = await Show.find({
            movie: movieId,
            showDateTime: { $gte: startOfToday },
        }).sort({ showDateTime: 1 });

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Movie not found",
            });
        }

        const dateTime = {};

        shows.forEach(show => {
            const iso = show.showDateTime.toISOString();
            const date = iso.split("T")[0];
            const time = iso.split("T")[1].slice(0, 5);

            if (!dateTime[date]) dateTime[date] = [];

            dateTime[date].push({
                time,
                showId: show._id,
                price: show.showPrice,
            });
        });

        res.status(200).json({
            success: true,
            movie,
            dateTime,
        });
    } catch (error) {
        console.error("GET SHOW ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
