import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Loading from '../components/Loading';
import { ArrowRight, ChevronLeft, Armchair } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';

const SeatLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shows, axios, getToken } = useAppContext();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  // NEW: State for real-time occupied seats
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  // --- SEAT CONFIGURATION ---
  const rows = [
    { id: 'A', count: 8, tier: 'Budget', color: 'text-teal-500', modifier: -2 },
    { id: 'B', count: 8, tier: 'Budget', color: 'text-teal-500', modifier: -2 },
    { id: 'C', count: 10, tier: 'Standard', color: 'text-blue-400', modifier: 0 },
    { id: 'D', count: 10, tier: 'Standard', color: 'text-blue-400', modifier: 0 },
    { id: 'E', count: 12, tier: 'Standard', color: 'text-blue-400', modifier: 0 },
    { id: 'F', count: 12, tier: 'Premium', color: 'text-yellow-500', modifier: 3 },
    { id: 'G', count: 14, tier: 'Premium', color: 'text-yellow-500', modifier: 3 },
  ];

  // Helper to get price for a specific row
  const getSeatPrice = (rowId) => {
    if (!show) return 0;
    const row = rows.find(r => r.id === rowId);
    const basePrice = show.showPrice || 0;
    let finalPrice = basePrice + (row?.modifier || 0);
    // Apply Discount (Decrease by 10), ensure min $5
    finalPrice = finalPrice - 10;
    return Math.max(finalPrice, 5);
  };

  // 1. Fetch Show Details
  useEffect(() => {
    const findShow = () => {
      if (!shows || shows.length === 0) return;
      const found = shows.find(s => s._id === id);
      if (found) {
        setShow(found);
        setPageLoading(false);
      } else {
        setPageLoading(false);
        toast.error("Show not found or expired.");
      }
    };
    findShow();
  }, [id, shows]);

  // 1.5 Fetch Real-time Occupied Seats
  useEffect(() => {
    const fetchOccupiedSeats = async () => {
      try {
        const { data } = await axios.get(`/api/booking/seats/${id}?_=${Date.now()}`);
        if (data.success) {
          setOccupiedSeats(data.occupiedSeats);
        }
      } catch (error) {
        console.error("Failed to fetch occupied seats", error);
      }
    };

    if (id) {
      fetchOccupiedSeats();
      // Optional: Poll every 2 seconds to keep it fresh
      const interval = setInterval(fetchOccupiedSeats, 2000);
      return () => clearInterval(interval);
    }
  }, [id]);

  // 2. Handle Seat Click
  const handleSeatClick = (seatLabel) => {
    if (occupiedSeats.includes(seatLabel)) return; // Use real-time data

    if (selectedSeats.includes(seatLabel)) {
      setSelectedSeats(prev => prev.filter(seat => seat !== seatLabel));
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("You can only select up to 6 seats");
        return;
      }
      setSelectedSeats(prev => [...prev, seatLabel]);
    }
  };

  // 3. Handle Booking (Create Pending Booking)
  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    setBookingLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please login to book tickets");
        setBookingLoading(false);
        return;
      }

      // Create Booking in DB
      const { data } = await axios.post('/api/booking/create', {
        showId: id,
        selectedSeats: selectedSeats
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success("Seats Reserved! Proceeding to payment...");
        // REDIRECT TO MY BOOKINGS
        navigate('/my-bookings');
      } else {
        toast.error(data.message || "Booking failed");
      }

    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
      // Refresh occupied seats on error to show what was taken
      try {
        const { data } = await axios.get(`/api/booking/seats/${id}`);
        if (data.success) {
          setOccupiedSeats(data.occupiedSeats);
        }
      } catch (refreshError) {
        console.error("Failed to refresh seats after error", refreshError);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // 4. Calculate Total Price dynamically
  const totalPrice = useMemo(() => {
    if (!show) return 0;
    return selectedSeats.reduce((total, seatLabel) => {
      const rowId = seatLabel.charAt(0);
      return total + getSeatPrice(rowId);
    }, 0);
  }, [selectedSeats, show]);

  if (pageLoading && (!shows || shows.length === 0)) return <Loading />;

  if (!show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1014] text-white">
        <h2 className="text-2xl font-bold mb-4">Show Not Found</h2>
        <button onClick={() => navigate('/movies')} className="px-6 py-2 bg-primary rounded-lg font-medium">Back to Movies</button>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen bg-[#0f1014] text-white pt-24 pb-32 overflow-hidden font-sans selection:bg-primary/30'>
      <BlurCircle top='-10%' left='-10%' opacity='0.2' />
      <BlurCircle bottom='-10%' right='-10%' opacity='0.2' />

      <div className='max-w-7xl mx-auto px-4 md:px-8'>
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-6">
          <div className='flex items-start gap-4'>
            <button onClick={() => navigate(-1)} className="mt-1 p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className='text-2xl md:text-4xl font-bold tracking-tight'>{show.movie?.title || "Movie Title"}</h1>
              <div className='flex items-center gap-2 mt-2 text-gray-400 text-sm flex-wrap'>
                <span className='bg-white/5 px-2 py-0.5 rounded text-xs uppercase tracking-wider border border-white/10'>{show.screen || "Screen 1"}</span>
                <span>•</span>
                <span>{show.movie?.runtime ? timeFormat(show.movie.runtime) : "N/A"}</span>
                <span>•</span>
                <span className="text-primary font-medium">
                  {new Date(show.showDateTime).toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Seat Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-medium bg-[#18181b] px-5 py-3 rounded-xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#27272a] border border-white/10"></div><span className="text-gray-400">Available</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary shadow-glow"></div><span className="text-gray-400">Selected</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-teal-500/20 border border-teal-500/50"></div><span className="text-gray-400">Budget (${getSeatPrice('A').toFixed(0)})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50"></div><span className="text-gray-400">Premium (${getSeatPrice('G').toFixed(0)})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-800 opacity-40"></div><span className="text-gray-500">Sold</span></div>
          </div>
        </div>

        {/* --- SCREEN VISUAL --- */}
        <div className="relative flex flex-col items-center justify-center mb-16 perspective-1000">
          <div className="absolute top-0 w-full max-w-2xl h-32 bg-gradient-to-b from-primary/10 to-transparent clip-path-trapezoid opacity-50 blur-xl pointer-events-none"></div>
          <div className="h-14 w-full max-w-3xl bg-gradient-to-b from-gray-700/50 to-transparent rounded-[50%] opacity-20 transform rotate-x-180 border-t border-white/20"></div>
          <div className="w-full max-w-3xl h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_30px_rgba(var(--primary),0.6)]"></div>
          <p className="mt-8 text-gray-500 text-[10px] tracking-[0.4em] font-semibold uppercase opacity-60">All eyes this way</p>
        </div>

        {/* --- SEAT GRID --- */}
        <div className="w-full overflow-x-auto pb-12 custom-scrollbar flex justify-center">
          <div className="flex flex-col gap-3 min-w-max p-4 items-center">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-8 group/row">
                <div className="w-10 flex flex-col items-end gap-0.5">
                  <span className="text-gray-400 text-xs font-bold">{row.id}</span>
                  <span className={`text-[9px] font-medium opacity-50 ${row.color}`}>${getSeatPrice(row.id).toFixed(1)}</span>
                </div>
                <div className="flex gap-2.5 justify-center">
                  {Array.from({ length: row.count }, (_, i) => {
                    const seatNumber = i + 1;
                    const seatLabel = `${row.id}${seatNumber}`;
                    const isBooked = occupiedSeats.includes(seatLabel);
                    const isSelected = selectedSeats.includes(seatLabel);
                    const isGap = seatNumber === 3 || seatNumber === row.count - 2;

                    return (
                      <React.Fragment key={seatLabel}>
                        <button
                          onClick={() => handleSeatClick(seatLabel)}
                          disabled={isBooked}
                          className={`group relative w-9 h-9 sm:w-11 sm:h-11 rounded-t-xl rounded-b-lg flex items-center justify-center transition-all duration-300
                            ${isBooked
                              ? 'bg-[#1e1e24] text-transparent cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] -translate-y-2 z-10'
                                : `bg-[#27272a] hover:bg-[#3f3f46] hover:border-${row.color.split('-')[1]}-500/50 border border-white/5`
                            }`}
                        >
                          <Armchair className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${isBooked ? 'text-gray-700' : isSelected ? 'fill-white text-white' : row.color}`} strokeWidth={2} />
                        </button>
                        {isGap && <div className="w-8 sm:w-14"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                <span className="w-10 text-gray-700 text-xs font-bold text-left opacity-20 group-hover/row:opacity-100 transition-opacity">{row.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- FLOATING CHECKOUT BAR --- */}
      <div className="fixed bottom-6 left-0 w-full px-4 md:px-6 z-50 pointer-events-none">
        <div className="max-w-4xl mx-auto bg-[#18181b]/90 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 pointer-events-auto ring-1 ring-white/5">
          <div className="flex flex-col pl-2">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Price</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white tracking-tight">${totalPrice.toFixed(2)}</span>
              {selectedSeats.length > 0 && <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded shadow-sm animate-fade-in">{selectedSeats.length} Seats</span>}
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={selectedSeats.length === 0 || bookingLoading}
            className={`group flex items-center gap-3 px-8 sm:px-10 py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${selectedSeats.length > 0 && !bookingLoading ? 'bg-primary hover:bg-red-600 text-white shadow-glow hover:-translate-y-1' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
          >
            {bookingLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;