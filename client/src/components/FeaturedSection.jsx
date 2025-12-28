import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FilmIcon } from "lucide-react";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";

const FeaturedSection = () => {
  const navigate = useNavigate();
  const { shows } = useAppContext();

  // ✅ LOGIC: Filter Unique Movies from Active Shows
  // The 'shows' array contains multiple entries (showtimes) for the same movie.
  // We filter it to get a list of unique movies currently showing.
  const uniqueMovies = useMemo(() => {
    const unique = [];
    const seenIds = new Set();

    if (shows && Array.isArray(shows)) {
      shows.forEach((show) => {
        // Ensure the show has a movie object and we haven't added it yet
        if (show.movie && !seenIds.has(show.movie._id)) {
          seenIds.add(show.movie._id);
          unique.push(show.movie); // Push the MOVIE object
        }
      });
    }
    return unique.slice(0, 4); // Display only top 4
  }, [shows]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden">
      {/* Header Section */}
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-gray-300 font-medium text-lg">Now Showing</p>

        <button
          onClick={() => navigate("/movies")}
          className="group flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
        >
          View All
          <ArrowRight className="group-hover:translate-x-0.5 transition w-4 h-4" />
        </button>
      </div>

      {/* Movies Grid */}
      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
        {uniqueMovies.length > 0 ? (
          uniqueMovies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))
        ) : (
          // Empty State Handling
          <div className="w-full flex flex-col items-center justify-center py-10 text-gray-500 border border-dashed border-gray-800 rounded-lg">
            <FilmIcon className="w-12 h-12 mb-2 opacity-50" />
            <p>No movies currently showing.</p>
          </div>
        )}
      </div>

      {/* Show More Button */}
      {uniqueMovies.length > 0 && (
        <div className="flex justify-center mt-20">
          <button
            onClick={() => {
              navigate("/movies");
              scrollTo(0, 0);
            }}
            className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer text-white shadow-lg shadow-primary/20"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedSection;