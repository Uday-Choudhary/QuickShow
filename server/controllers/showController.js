import axios from "axios";
import Movie from "../models/Movies.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

/* ================= NOW PLAYING (INDIAN REGION) ================= */
export const getNowPlayingMovies = async (req, res) => {
    try {
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ message: "TMDB API key missing" });
        }

        const { data } = await axios.get(
            "https://api.themoviedb.org/3/movie/now_playing",
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    region: 'IN', // ✅ Fix: Fetch Indian Theatrical releases
                    page: 1
                },
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
        // ✅ Updated to match Frontend payload: { movieId, price, dates }
        const { movieId, price, dates } = req.body;

        if (
            !movieId ||
            !dates ||
            Object.keys(dates).length === 0 ||
            typeof price !== "number"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data: Movie, Price, or Dates missing",
            });
        }

        let movie = await Movie.findById(movieId);

        /* ---------- fetch movie if not exists ---------- */
        if (!movie) {
            try {
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
            } catch (tmdbError) {
                console.error("Failed to fetch movie details from TMDB", tmdbError);
                return res.status(500).json({ success: false, message: "Failed to fetch movie details from TMDB" });
            }
        }

        /* ---------- build show docs (UTC safe) ---------- */
        const showsToCreate = [];

        // ✅ Updated to handle Object: { "2024-12-28": ["10:00", "14:00"] }
        Object.entries(dates).forEach(([date, times]) => {
            if (Array.isArray(times)) {
                times.forEach(t => {
                    // Combine date and time string
                    const dateTimeString = `${date}T${t}:00`;
                    const showDateTime = new Date(dateTimeString);

                    // Only add future shows
                    if (showDateTime > new Date()) {
                        showsToCreate.push({
                            movie: movieId,
                            showDateTime: showDateTime,
                            showPrice: price, // Mapped 'price' from body to 'showPrice' schema
                            occupiedSeats: {}, // Initialize as empty object
                        });
                    }
                });
            }
        });

        if (showsToCreate.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All provided show times are in the past or invalid",
            });
        }

        await Show.insertMany(showsToCreate);

        await inngest.send({
            name: "app/show.added",
            data: {
                shows: { movieTitle: movie.title }
            }
        })

        res.status(201).json({
            success: true,
            message: `${showsToCreate.length} shows added successfully`,
        });
    } catch (error) {
        console.error("ADD SHOW ERROR:", error);
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
            // Convert to local date string for grouping
            const dateObj = new Date(show.showDateTime);

            // Format YYYY-MM-DD manually to avoid timezone shifts
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const date = `${year}-${month}-${day}`;

            // Format HH:MM
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const time = `${hours}:${minutes}`;

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

/* ================= GET TRAILERS ================= */
export const getTrailers = async (req, res) => {
    try {
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ message: "TMDB API key missing" });
        }

        // 1. Fetch upcoming (or now playing) movies
        console.log("Fetching upcoming movies...");
        const { data } = await axios.get(
            `https://api.themoviedb.org/3/movie/upcoming`,
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    region: 'IN', // customized for region
                    page: 1
                }
            }
        );
        console.log("Fetched upcoming movies:", data.results.length);

        // 2. Take top 5 movies
        const movies = data.results.slice(0, 5);

        // 3. Fetch videos for each movie
        const trailerPromises = movies.map(async (movie) => {
            try {
                const videoRes = await axios.get(
                    `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
                    {
                        params: { api_key: process.env.TMDB_API_KEY }
                    }
                );

                // Find a youtube Trailer
                const trailer = videoRes.data.results.find(
                    (vid) => vid.site === "YouTube" && (vid.type === "Trailer" || vid.type === "Teaser")
                );

                return {
                    id: movie.id,
                    title: movie.title,
                    image: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
                    videoUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
                    key: trailer ? trailer.key : null,
                    subtitle: `${movie.release_date} • ${movie.original_language.toUpperCase()}`
                };
            } catch (innerError) {
                console.error(`Failed to fetch video for movie ${movie.id}:`, innerError.message);
                return null;
            }
        });

        const trailers = await Promise.all(trailerPromises);

        // Filter out failed fetches and those without videoUrl
        const validTrailers = trailers.filter(t => t && t.videoUrl);

        res.status(200).json({
            success: true,
            trailers: validTrailers
        });

    } catch (error) {
        console.error("GET TRAILERS ERROR:", error.message, error.response?.data);
        res.status(500).json({ success: false, message: error.message });
    }
};