import { StarIcon, ClockIcon, CalendarDaysIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';

const MovieCard = ({ movie }) => {
    const navigate = useNavigate();

    // 1. Get Base URL from .env (with safe fallback)
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/original";

    // 2. Safety Check
    if (!movie) return null;

    // 3. Construct Image URL (Prefer backdrop for landscape card)
    const imageUrl = movie.backdrop_path
        ? `${image_base_url}${movie.backdrop_path}`
        : (movie.poster_path ? `${image_base_url}${movie.poster_path}` : "https://via.placeholder.com/400x225?text=No+Image");

    const handleNavigate = () => {
        navigate(`/movies/${movie._id}`);
        scrollTo(0, 0);
    };

    // Safe Data Extraction
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
    const genres = movie.genres?.slice(0, 2).map((genre) => genre?.name || genre).join(" | ") || "Movie";
    const runtime = movie.runtime ? timeFormat(movie.runtime) : "N/A";
    const rating = movie.vote_average?.toFixed(1) || "0.0";

    return (
        <div
            className='group flex flex-col w-[280px] bg-[#18181b] rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer'
            onClick={handleNavigate}
        >
            {/* --- Image Section --- */}
            <div className="relative h-44 w-full overflow-hidden bg-gray-900">
                <img
                    src={imageUrl}
                    alt={movie.title}
                    className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                    loading="lazy"
                />

                {/* Overlay gradient for better text contrast if needed later */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent opacity-60"></div>

                {/* Rating Badge (Glassmorphism) */}
                <div className='absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10'>
                    <StarIcon className='w-3.5 h-3.5 text-yellow-400 fill-yellow-400' />
                    <span className="text-xs font-bold text-white">
                        {rating}
                    </span>
                </div>
            </div>

            {/* --- Content Section --- */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    {/* Title */}
                    <h3 className='font-bold text-base text-white truncate leading-tight group-hover:text-primary transition-colors'>
                        {movie.title}
                    </h3>

                    {/* Metadata */}
                    <div className='flex items-center gap-3 text-xs text-gray-400 mt-2.5 font-medium'>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>{releaseYear}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <ClockIcon className="w-3 h-3" />
                            <span>{runtime}</span>
                        </div>
                    </div>

                    {/* Genres */}
                    <p className="text-xs text-gray-500 mt-2 truncate">
                        {genres}
                    </p>
                </div>

                {/* Button Section */}
                <div className='mt-5'>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent double navigation trigger
                            handleNavigate();
                        }}
                        className='w-full py-2.5 text-sm bg-primary hover:bg-red-600 transition-colors rounded-xl font-bold text-white shadow-md shadow-primary/20 flex items-center justify-center gap-2 group-hover:shadow-primary/40'
                    >
                        Buy Tickets
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;