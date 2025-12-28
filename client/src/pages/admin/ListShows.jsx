import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { CalendarIcon, TicketIcon, FilmIcon } from 'lucide-react';

const ListShows = () => {

  const { axios, getToken } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Fetch shows error:", error);
      toast.error("Failed to fetch shows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllShows();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <Title text1="All" text2="Scheduled Shows" />

      {shows.length === 0 ? (
        <div className="mt-20 flex flex-col items-center justify-center text-gray-500 opacity-60">
          <FilmIcon className="w-16 h-16 mb-4" />
          <p className="text-lg">No shows currently scheduled.</p>
        </div>
      ) : (
        <div className="mt-8 bg-gray-900/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="p-5 font-semibold">Movie Details</th>
                  <th className="p-5 font-semibold">Schedule</th>
                  <th className="p-5 font-semibold text-center">Ticket Price</th>
                  <th className="p-5 font-semibold text-center">Bookings</th>
                  <th className="p-5 font-semibold text-right">Total Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {shows.map((show, index) => {
                  // Calculate bookings count safely
                  const bookingsCount = show.occupiedSeats
                    ? (Array.isArray(show.occupiedSeats) ? show.occupiedSeats.length : Object.keys(show.occupiedSeats).length)
                    : 0;

                  // Calculate earnings
                  const earnings = bookingsCount * show.showPrice;

                  return (
                    <tr
                      key={index}
                      className="hover:bg-white/5 transition-colors duration-200 group"
                    >
                      {/* Movie Column */}
                      <td className="p-4 pl-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                            <img
                              src={image_base_url + show.movie?.poster_path}
                              alt={show.movie?.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="max-w-[200px]">
                            <p className="font-bold text-white truncate">{show.movie?.title || "Unknown"}</p>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Active
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-white">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span>{dateFormat(show.showDateTime).split(',')[0]}</span>
                          </div>
                          <span className="text-gray-500 text-xs pl-6">
                            {dateFormat(show.showDateTime).split(',')[1]}
                          </span>
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="p-4 text-center font-medium">
                        {currency} {show.showPrice}
                      </td>

                      {/* Bookings Column */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                          <TicketIcon className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-200 font-bold">{bookingsCount}</span>
                        </div>
                      </td>

                      {/* Earnings Column */}
                      <td className="p-4 text-right pr-5">
                        <p className={`font-bold text-lg ${earnings > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {currency} {earnings.toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListShows;