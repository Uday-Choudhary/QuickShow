import React, { useState, useEffect } from 'react';
import Loading from '../../components/Loading';
import { CheckIcon, TrashIcon, StarIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import Title from '../../components/admin/Title';
// import { kConverter } from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddShows = () => {

  const { axios, getToken } = useAppContext();

  // Env Variables
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  // State
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState('');
  const [showPrice, setShowPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Movies
  const fetchNowPlayingMovies = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/shows/now-playing", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setNowPlayingMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error("Failed to fetch movies");
    }
  };

  // ✅ TOGGLE SELECTION LOGIC
  const toggleMovieSelection = (id) => {
    setSelectedMovie((prev) => (prev === id ? null : id));
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return toast.error("Please select a date and time");

    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (times.includes(time)) {
        toast.error("Time slot already added for this date");
        return prev;
      }
      return { ...prev, [date]: [...times, time].sort() };
    });
    setDateTimeInput('');
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleAddShow = async () => {
    if (!selectedMovie) return toast.error("Please select a movie");
    if (!showPrice) return toast.error("Please enter a show price");
    if (Object.keys(dateTimeSelection).length === 0) return toast.error("Please add at least one show time");

    setIsLoading(true);
    try {
      const token = await getToken();
      const payload = {
        movieId: selectedMovie,
        price: Number(showPrice),
        dates: dateTimeSelection
      };

      const { data } = await axios.post("/api/shows/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setSelectedMovie(null);
        setShowPrice('');
        setDateTimeSelection({});
        setDateTimeInput('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Add show failed:", error);
      toast.error(error.response?.data?.message || "Failed to add show");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNowPlayingMovies();
  }, []);

  if (nowPlayingMovies.length === 0) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-6">
        <Title text1="Create" text2="New Show" />
      </div>

      {/* --- MOVIE SELECTION GRID --- */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-200">1. Select a Movie</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {nowPlayingMovies.map((movie) => {
            const isSelected = selectedMovie === movie.id;
            return (
              <div
                key={movie.id}
                onClick={() => toggleMovieSelection(movie.id)}
                className={`
                  relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300
                  ${isSelected ? 'ring-4 ring-primary scale-95 shadow-2xl' : 'hover:scale-105 hover:shadow-lg'}
                `}
              >
                {/* Image */}
                <img
                  src={image_base_url + movie.poster_path}
                  alt={movie.title}
                  className={`w-full h-[280px] object-cover transition-all duration-500 ${isSelected ? 'brightness-50' : 'group-hover:brightness-75'}`}
                />

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-primary p-3 rounded-full shadow-lg animate-bounce">
                      <CheckIcon className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <h4 className="font-bold text-white truncate text-sm">{movie.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-300">{movie.release_date?.split('-')[0]}</p>
                    <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-xs text-yellow-400">
                      <StarIcon className="w-3 h-3 fill-yellow-400" />
                      {movie.vote_average?.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- CONFIGURATION SECTION --- */}
      <div className="grid md:grid-cols-2 gap-8 bg-white/5 p-6 rounded-2xl border border-white/10">

        {/* Left: Inputs */}
        <div className="space-y-6">

          {/* Price Input */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-200">2. Ticket Price</h3>
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg focus-within:border-primary transition-colors">
              <span className="text-gray-400 text-lg font-medium pl-1">{currency}</span>
              <input
                type="number"
                min="0"
                value={showPrice}
                onChange={(e) => setShowPrice(e.target.value)}
                placeholder="0.00"
                className="bg-transparent outline-none w-full text-white text-lg"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-200">3. Add Schedule</h3>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-lg focus-within:border-primary transition-colors flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={dateTimeInput}
                  onChange={(e) => setDateTimeInput(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-300 text-sm"
                />
              </div>
              <button
                onClick={handleDateTimeAdd}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAddShow}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg mt-4 shadow-lg transition-all
              ${isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-red-600 text-white shadow-red-900/20'}
            `}
          >
            {isLoading ? 'Creating Show...' : 'Create Show'}
          </button>
        </div>

        {/* Right: Schedule Preview */}
        <div className="bg-black/20 rounded-xl p-5 border border-white/5 min-h-[250px]">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Selected Schedules
          </h3>

          {Object.keys(dateTimeSelection).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 pb-10">
              <ClockIcon className="w-12 h-12 mb-2" />
              <p>No schedules added yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(dateTimeSelection).map(([date, times]) => (
                <div key={date} className="bg-gray-800/50 rounded-lg p-3 border border-white/5">
                  <div className="text-primary font-medium mb-2 text-sm">{date}</div>
                  <div className="flex flex-wrap gap-2">
                    {times.map((time) => (
                      <div key={time} className="group flex items-center gap-2 bg-black/40 border border-gray-600 px-3 py-1.5 rounded text-xs text-gray-300 hover:border-red-500 transition-colors">
                        <span>{time}</span>
                        <button onClick={() => handleRemoveTime(date, time)}>
                          <TrashIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShows;