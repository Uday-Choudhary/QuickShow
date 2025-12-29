import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  UsersIcon,
  StarIcon,
  ClockIcon,
  CalendarIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";

const Dashboard = () => {
  const { axios, getToken } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY || "$";
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);

  /* ===================== FETCH DASHBOARD DATA ===================== */
  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.dashboardData) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ===================== STATS CONFIG ===================== */
  const dashboardCards = [
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings,
      icon: ChartLineIcon,
    },
    {
      title: "Total Revenue",
      value: `${currency}${dashboardData.totalRevenue.toLocaleString()}`,
      icon: CircleDollarSignIcon,
    },
    {
      title: "Active Shows",
      value: dashboardData.activeShows.length,
      icon: PlayCircleIcon,
    },
    {
      title: "Total Users",
      value: dashboardData.totalUsers,
      icon: UsersIcon,
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      <Title text1="Admin" text2="Dashboard" />

      {/* ===================== STATS CARDS ===================== */}
      <div className="relative mt-8">
        <BlurCircle top="-80px" left="0" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-4 px-5 py-4 bg-primary/10 border border-primary/20 rounded-lg"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                {/* Text */}
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-2xl font-semibold text-white leading-tight">
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== ACTIVE SHOWS ===================== */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-200">
            Currently Active Shows
          </h2>
          <span className="text-sm text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            {dashboardData.activeShows.length} Live
          </span>
        </div>

        <div className="relative">
          <BlurCircle top="50%" right="0" opacity="0.3" />

          {dashboardData.activeShows.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
              <PlayCircleIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No active shows at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {dashboardData.activeShows.map((show) => {
                if (!show || !show.movie) return null;
                return (
                  <div
                    key={show._id}
                    className="group bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={image_base_url + show.movie.poster_path}
                        alt={show.movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-yellow-400 flex items-center gap-1">
                        <StarIcon className="w-3 h-3 fill-yellow-400" />
                        {show.movie.vote_average?.toFixed(1) || "N/A"}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                        {show.movie.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-bold">
                          {currency} {show.showPrice}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {show.movie.runtime}m
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-gray-400">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{dateFormat(show.showDateTime)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
