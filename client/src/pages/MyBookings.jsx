import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CreditCard,
  Film,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const MyBookings = () => {
  const navigate = useNavigate();
  const { axios, getToken } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY || "$";
  const image_base_url =
    import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
    "https://image.tmdb.org/t/p/original";

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  /* ================= FETCH BOOKINGS ================= */
  const getMyBookings = async () => {
    try {
      const token = await getToken();
      if (!token) {
        navigate("/");
        return;
      }

      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error("Failed to fetch bookings");
      }
    } catch (error) {
      toast.error("Could not load your bookings");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= PAYMENT ================= */
  const handlePayment = async (bookingId) => {
    try {
      setPayingId(bookingId);
      const token = await getToken();

      const { data } = await axios.post(
        "/api/user/payment",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.error("Payment initialization failed");
      }
    } catch (error) {
      toast.error("Payment service unavailable");
    } finally {
      setPayingId(null);
    }
  };

  /* ================= EXPIRED BOOKING ================= */
  const handleBookingExpired = (bookingId) => {
    setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    toast.error("Booking expired and removed");
  };

  useEffect(() => {
    getMyBookings();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="relative min-h-screen bg-[#0f1014] px-6 md:px-16 lg:px-32 xl:px-40 pt-32 pb-20 overflow-hidden">

      {/* Background */}
      <BlurCircle top="120px" left="-60px" opacity="0.3" />
      <BlurCircle bottom="0" right="-60px" opacity="0.3" />

      {/* Header */}
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          My Bookings
        </h1>
        <p className="text-gray-400 mt-2">
          Manage your tickets and payments
        </p>
      </div>

      {/* Bookings */}
      <div className="flex flex-col gap-6">
        {bookings.length > 0 ? (
          bookings.map((item) => {
            const movie = item.shows?.movie;
            const showTime = item.shows?.showDateTime
              ? new Date(item.shows.showDateTime)
              : null;

            if (!movie) return null;

            return (
              <div
                key={item._id}
                className="flex flex-col md:flex-row bg-[#18181b]/60 border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Poster */}
                <div className="w-full md:w-48 h-64 md:h-auto">
                  <img
                    src={image_base_url + movie.poster_path}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <h2 className="text-2xl font-bold text-white">
                        {movie.title}
                      </h2>
                      {/* Timer Display */}
                      {!item.isPaid && (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <BookingTimer
                            createdAt={item.createdAt}
                            onExpire={() => handleBookingExpired(item._id)}
                          />
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded
                        ${item.isPaid
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                    >
                      {item.isPaid ? "Confirmed" : "Payment Pending"}
                    </span>

                    <div className="grid sm:grid-cols-2 gap-3 mt-6 text-sm text-gray-300">
                      <InfoRow
                        icon={Calendar}
                        text={
                          showTime
                            ? showTime.toLocaleDateString("en-US", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                            })
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={Clock}
                        text={
                          showTime
                            ? showTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={MapPin}
                        text={item.shows?.screen || "Main Screen"}
                      />
                      <InfoRow
                        icon={Ticket}
                        text={`${item.bookedSeats.length} Tickets`}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {currency}
                        {item.amount}
                      </p>
                    </div>

                    {item.isPaid ? (
                      <button
                        disabled
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-gray-400 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePayment(item._id)}
                        disabled={payingId === item._id}
                        className="
                          flex items-center gap-2
                          px-6 py-2.5
                          bg-primary hover:bg-red-600
                          text-white text-sm font-semibold
                          rounded-lg
                          transition-colors
                          focus:outline-none focus:ring-2 focus:ring-primary/50
                          disabled:opacity-60 disabled:cursor-not-allowed
                        "
                      >
                        <CreditCard className="w-4 h-4" />
                        {payingId === item._id ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[#18181b]/50 rounded-2xl border border-dashed border-white/10">
            <Film className="w-10 h-10 text-gray-500 mb-4" />
            <h3 className="text-xl font-bold text-white">
              No bookings yet
            </h3>
            <button
              onClick={() => navigate("/movies")}
              className="mt-6 px-8 py-2.5 bg-primary hover:bg-red-600 text-white rounded-full font-medium"
            >
              Book a Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= SMALL COMPONENT ================= */
const InfoRow = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-primary" />
    <span>{text}</span>
  </div>
);

const BookingTimer = ({ createdAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdTime = new Date(createdAt).getTime();
      const expirationTime = createdTime + 7 * 60 * 1000; // 7 minutes
      const now = new Date().getTime();
      const difference = expirationTime - now;

      if (difference <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire();
        return;
      }
      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [createdAt, onExpire]);

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return <span className="text-red-500 font-bold text-xs uppercase">Expired</span>;
  }

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="text-yellow-400 font-mono font-bold text-sm">
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

export default MyBookings;
