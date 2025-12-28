import React, { useMemo, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import { SearchIcon, FilmIcon, XIcon } from "lucide-react";
import Loading from "../components/Loading";

const Movies = () => {
  const { shows } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= EXTRACT UNIQUE MOVIES ================= */
  const uniqueMovies = useMemo(() => {
    const unique = [];
    const seenIds = new Set();

    if (Array.isArray(shows)) {
      shows.forEach((show) => {
        if (show.movie && !seenIds.has(show.movie._id)) {
          seenIds.add(show.movie._id);
          unique.push(show.movie);
        }
      });
    }
    return unique;
  }, [shows]);

  /* ================= FILTER MOVIES ================= */
  const filteredMovies = uniqueMovies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen px-6 md:px-16 lg:px-24 xl:px-44 pt-32 pb-20 overflow-hidden">

      {/* Background Blurs */}
      <BlurCircle top="120px" left="-60px" opacity="0.3" />
      <BlurCircle bottom="120px" right="-60px" opacity="0.3" />

      {/* ================= HEADER ================= */}
      <div className="relative z-10 mb-12 border-b border-white/10 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Now Showing
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              Book tickets for the latest blockbusters
            </p>
          </div>

          {/* Search Bar (Aligned & Subtle) */}
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />

            <input
              type="text"
              placeholder="Search movies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-9 pr-9 py-2
                bg-[#121212] border border-gray-700 rounded-md
                text-sm text-gray-300 placeholder-gray-500
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                transition
              "
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {shows === null ? (
        <div className="flex justify-center mt-20">
          <Loading />
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center sm:place-items-start">
          {filteredMovies.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-[#18181b]/50 rounded-2xl border border-dashed border-gray-800 mt-4 text-center">
          <div className="bg-gray-800 p-4 rounded-full mb-4 ring-4 ring-gray-800/50">
            <FilmIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No movies found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `We couldn't find any matches for "${searchQuery}"`
              : "There are no shows scheduled at the moment."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Movies;
