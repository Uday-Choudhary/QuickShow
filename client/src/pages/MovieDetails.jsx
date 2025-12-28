import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon, Calendar, Clock, Ticket } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { shows, axios, getToken } = useAppContext();

  const [movie, setMovie] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Get Image Base URL
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/original";

  // 2. LOGIC: Find this Movie in the Active Shows list
  const movieShows = useMemo(() => {
    if (!shows || !Array.isArray(shows)) return [];
    return shows.filter(s => s.movie && s.movie._id === id);
  }, [shows, id]);

  // 3. LOGIC: Fetch Data & Check Favorites
  useEffect(() => {
    const initPage = async () => {
      // Find movie from active shows
      if (shows.length > 0) {
        const foundShow = shows.find((s) => s.movie && s.movie._id === id);

        if (foundShow) {
          setMovie(foundShow.movie);
        }

        // Check favorite status (only if user is logged in)
        try {
          const token = await getToken();
          if (token) {
            const { data } = await axios.get("/api/user/favourites", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
              const isFav = data.movies.some(m => m._id === id);
              setIsFavorite(isFav);
            }
          }
        } catch (error) {
          // Silent fail for guest users
          console.error("Fav check error", error);
        }
      }
      setLoading(false);
    };

    initPage();
    scrollTo(0, 0);
  }, [id, shows]);

  // 4. FUNCTION: Handle Favorite Toggle
  const handleToggleFavorite = async () => {
    const previousState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic Update

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please login to add favorites");
        setIsFavorite(previousState);
        return;
      }

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(previousState ? "Removed from Favorites" : "Added to Favorites");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Fav toggle error:", error);
      toast.error("Failed to update favorites");
      setIsFavorite(previousState);
    }
  };

  // 5. LOGIC: Get Recommendations
  const relatedMovies = useMemo(() => {
    const unique = [];
    const seen = new Set();
    if (shows && Array.isArray(shows)) {
      shows.forEach(s => {
        if (s.movie && s.movie._id !== id && !seen.has(s.movie._id)) {
          seen.add(s.movie._id);
          unique.push(s.movie);
        }
      });
    }
    return unique.slice(0, 4);
  }, [shows, id]);

  if (loading) return <Loading />;

  // Fallback if movie not found in shows
  if (!movie) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1014] text-gray-500">
      <p className="text-xl">Movie details not found.</p>
      <button onClick={() => navigate('/movies')} className="mt-4 text-primary hover:underline">Browse Movies</button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#0f1014] overflow-x-hidden text-white font-sans">

      {/* --- 1. CINEMATIC HERO BACKGROUND --- */}
      {/* FIX: Removed -z-10, changed to absolute z-0 */}
      <div className="absolute top-0 left-0 w-full h-[85vh] z-0 overflow-hidden">
        {/* Full Screen Backdrop Image */}
        <img
          src={image_base_url + movie.backdrop_path}
          alt="Backdrop"
          className="w-full h-full object-cover opacity-40 scale-105" // Increased opacity slightly for visibility
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014]/90 via-transparent to-[#0f1014]/90" />
      </div>

      {/* FIX: Added relative z-10 to ensure content sits ON TOP of the image */}
      <div className="relative z-10 px-6 md:px-16 lg:px-32 xl:px-40 pt-32 md:pt-48 pb-20">
        <div className="flex flex-col md:flex-row gap-12 max-w-7xl mx-auto items-start">

          {/* --- 2. POSTER (Floating Effect) --- */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-72 md:w-80 relative z-10">
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.3)] border border-white/10 transition-transform duration-500 hover:scale-[1.02]">
              <img
                src={image_base_url + movie.poster_path}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>

          {/* --- 3. INFO SECTION --- */}
          <div className="flex flex-col gap-6 flex-1 text-center md:text-left relative z-10">
            <BlurCircle top="-100px" left="-100px" opacity="0.4" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now Showing
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-xl text-gray-400 font-light mt-2 italic">"{movie.tagline}"</p>
              )}
            </div>

            {/* Metadata Pills */}
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-yellow-100">{movie.vote_average?.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-blue-100">{timeFormat(movie.runtime)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className="text-green-100">{movie.release_date?.split("-")[0]}</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {movie.genres?.map((genre, idx) => (
                <span key={idx} className="text-xs font-medium text-gray-300 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl">
              {movie.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <a
                href="#dateSelect"
                className="relative px-8 py-4 bg-primary hover:bg-red-600 text-white rounded-xl font-bold text-base shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-1 flex items-center gap-2 overflow-hidden group"
              >
                <Ticket className="w-5 h-5" />
                <span>Book Tickets</span>
              </a>

              <button
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold flex items-center gap-2 transition-all hover:-translate-y-1 backdrop-blur-sm group"
                onClick={() => toast("Trailer coming soon!")}
              >
                <PlayCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                <span>Watch Trailer</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`p-4 rounded-xl border transition-all hover:-translate-y-1 ${isFavorite ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* --- 4. CAST SECTION --- */}
        {movie.casts && movie.casts.length > 0 && (
          <div className="mt-24 relative">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-primary rounded-full"></span>
              Top Cast
            </h3>

            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar mask-fade-right">
              {movie.casts.slice(0, 10).map((cast, index) => (
                <div key={index} className="flex flex-col items-center min-w-[120px] group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 mb-4 shadow-lg group-hover:border-primary transition-colors duration-300">
                    <img
                      src={image_base_url + cast.profile_path}
                      alt={cast.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                      onError={(e) => e.target.src = "https://via.placeholder.com/100?text=Actor"}
                    />
                  </div>
                  <p className="text-white text-sm font-bold text-center group-hover:text-primary transition-colors">{cast.name}</p>
                  <p className="text-gray-500 text-xs text-center mt-1 truncate w-full px-2">{cast.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 5. BOOKING SECTION --- */}
        <div id="dateSelect" className="mt-24 scroll-mt-32">
          <div className="bg-[#18181b]/50 border border-white/5 rounded-3xl p-1 md:p-8 backdrop-blur-sm shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 px-4 pt-4 md:pt-0">
              <span className="w-1.5 h-8 bg-primary rounded-full"></span>
              Select Show Time
            </h3>
            <DateSelect movieShows={movieShows} movie={movie} />
          </div>
        </div>

        {/* --- 6. RECOMMENDATIONS --- */}
        {relatedMovies.length > 0 && (
          <div className="mt-32 border-t border-white/5 pt-16">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-white">You May Also Like</h3>
              <button onClick={() => navigate('/movies')} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                View All Movies
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <button
                onClick={() => { navigate('/movies'); scrollTo(0, 0) }}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm font-medium transition-all"
              >
                Browse More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;