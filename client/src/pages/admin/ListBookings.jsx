import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import {
  UserIcon,
  ArmchairIcon,
  CalendarIcon,
  CheckCircleIcon,
  TicketIcon,
  ClockIcon
} from 'lucide-react';

const ListBookings = () => {

  const { axios, getToken } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllBookings();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <Title text1="All" text2="Bookings" />

      {bookings.length === 0 ? (
        <div className="mt-20 flex flex-col items-center justify-center text-gray-500 opacity-60">
          <TicketIcon className="w-16 h-16 mb-4" />
          <p className="text-lg">No bookings found.</p>
        </div>
      ) : (
        <div className="mt-8 bg-gray-900/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="p-5 font-semibold">User Details</th>
                  <th className="p-5 font-semibold">Movie Details</th>
                  <th className="p-5 font-semibold">Show Time</th>
                  <th className="p-5 font-semibold">Seats</th>
                  <th className="p-5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {bookings.map((booking, index) => {
                  // Handle different seat data structures (Array vs Object)
                  const seatList = Array.isArray(booking.bookedSeats)
                    ? booking.bookedSeats
                    : Object.values(booking.bookedSeats || {});

                  // Handle potential field naming mismatch (show vs shows)
                  const showData = booking.show || booking.shows;

                  return (
                    <tr
                      key={index}
                      className="hover:bg-white/5 transition-colors duration-200 group"
                    >
                      {/* User Column */}
                      <td className="p-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{booking.user?.name || "Guest User"}</p>
                            <p className="text-xs text-gray-500">{booking.user?.email || "No Email"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Movie Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {showData?.movie?.poster_path && (
                            <img
                              src={image_base_url + showData.movie.poster_path}
                              alt="poster"
                              className="w-8 h-12 object-cover rounded shadow-sm"
                            />
                          )}
                          <span className="font-medium text-gray-200">
                            {showData?.movie?.title || "Unknown Movie"}
                          </span>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          <div className="flex flex-col text-xs">
                            <span className="text-white">{dateFormat(showData?.showDateTime).split(',')[0]}</span>
                            <span>{dateFormat(showData?.showDateTime).split(',')[1]}</span>
                          </div>
                        </div>
                      </td>

                      {/* Seats Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ArmchairIcon className="w-4 h-4 text-gray-500" />
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {seatList.map((seat, i) => (
                              <span key={i} className="text-xs bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                                {seat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td className="p-4 text-right pr-5">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-lg text-white">
                            {currency} {booking.amount}
                          </span>
                          {booking.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                              <CheckCircleIcon className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                              <ClockIcon className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
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

export default ListBookings;