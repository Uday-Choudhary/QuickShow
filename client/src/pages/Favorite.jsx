import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { HeartIcon } from "lucide-react";
import toast from "react-hot-toast";

const Favorite = () => {
  const { axios, getToken } = useAppContext();

  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Favorites from Backend
  const fetchFavorites = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get("/api/user/favourites", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error("Failed to load favorites");
      }
    } catch (error) {
      console.error("Fetch favorites error:", error);
      toast.error("Could not fetch your favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 md:px-16 lg:px-24 xl:px-44 pt-32 pb-20 overflow-hidden">

      {/* Background Blurs */}
      <BlurCircle top="100px" left="-50px" opacity="0.3" />
      <BlurCircle bottom="100px" right="-50px" opacity="0.3" />

      {/* --- Header Section --- */}
      <div className="relative z-10 mb-12 border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Your Favorites
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Movies you have bookmarked
        </p>
      </div>

      {/* --- Content Section --- */}
      {favoriteMovies.length > 0 ? (
        // Favorites Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center sm:place-items-start">
          {favoriteMovies.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-24 bg-[#18181b]/50 rounded-2xl border border-dashed border-gray-800 mt-4 text-center">
          <div className="bg-gray-800 p-4 rounded-full mb-4 ring-4 ring-gray-800/50">
            <HeartIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No favorites yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            You haven't added any movies to your favorites list yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default Favorite;