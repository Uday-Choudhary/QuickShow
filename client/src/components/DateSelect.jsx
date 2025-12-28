import React, { useState, useMemo, useEffect } from 'react';
import BlurCircle from './BlurCircle';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, MonitorPlay, TicketIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DateSelect = ({ movieShows }) => {
    const navigate = useNavigate();

    // State
    const [selectedDateKey, setSelectedDateKey] = useState(null);
    const [selectedShowId, setSelectedShowId] = useState(null);

    // 1. Logic: Group Shows by Date
    const showsByDate = useMemo(() => {
        const groups = {};
        if (!movieShows || !Array.isArray(movieShows)) return groups;

        movieShows.forEach((show) => {
            const dateObj = new Date(show.showDateTime);
            const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!groups[dateKey]) {
                groups[dateKey] = {
                    dateObj: dateObj,
                    shows: []
                };
            }
            groups[dateKey].shows.push(show);
        });
        return groups;
    }, [movieShows]);

    const availableDates = Object.keys(showsByDate).sort();

    // Auto-select first date
    useEffect(() => {
        if (availableDates.length > 0 && !selectedDateKey) {
            setSelectedDateKey(availableDates[0]);
        }
    }, [availableDates]);

    const onBookHandler = () => {
        if (!selectedShowId) {
            return toast.error('Please select a show time');
        }
        navigate(`/buy/${selectedShowId}`);
        window.scrollTo(0, 0);
    };

    if (availableDates.length === 0) {
        return (
            <div className='pt-16'>
                <div className='p-10 bg-[#18181b] border border-white/10 rounded-2xl text-center shadow-2xl'>
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MonitorPlay className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-white font-medium text-lg">No Shows Available</h3>
                    <p className='text-gray-500 mt-1'>Check back later for new schedules.</p>
                </div>
            </div>
        );
    }

    return (
        <div id='dateSelect' className='pt-12'>
            <div className='relative flex flex-col gap-10 p-8 md:p-10 bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl'>

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                <BlurCircle top="-120px" left="-120px" opacity="0.4" />

                {/* --- 1. DATE SELECTION --- */}
                <div className='relative z-10'>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            Select Date
                        </h3>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className='flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x'>
                        {availableDates.map((dateKey) => {
                            const { dateObj } = showsByDate[dateKey];
                            const isSelected = selectedDateKey === dateKey;

                            return (
                                <button
                                    onClick={() => {
                                        setSelectedDateKey(dateKey);
                                        setSelectedShowId(null);
                                    }}
                                    key={dateKey}
                                    className={`snap-start flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${isSelected
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 translate-y-0'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1'
                                        }`}
                                >
                                    <span className="text-xs uppercase font-bold tracking-widest mb-1 opacity-80">
                                        {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                                    </span>
                                    <span className="text-2xl font-black">
                                        {dateObj.getDate()}
                                    </span>
                                    <span className="text-[10px] mt-1 font-medium opacity-60">
                                        {dateObj.toLocaleDateString("en-US", { month: "short" })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* --- 2. TIME SELECTION --- */}
                {selectedDateKey && (
                    <div className='relative z-10 animate-fade-in'>
                        <h3 className='text-xl font-bold text-white mb-6 flex items-center gap-2'>
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            Select Show Time
                        </h3>

                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                            {showsByDate[selectedDateKey].shows.map((show) => {
                                const time = new Date(show.showDateTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });
                                const isSelected = selectedShowId === show._id;

                                return (
                                    <button
                                        key={show._id}
                                        onClick={() => setSelectedShowId(show._id)}
                                        className={`relative p-4 rounded-xl border text-left transition-all duration-200 group ${isSelected
                                                ? 'bg-white text-black border-white shadow-xl scale-[1.02]'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`} />
                                                <span className={`font-bold text-lg ${isSelected ? 'text-black' : 'text-white'}`}>
                                                    {time}
                                                </span>
                                            </div>
                                            {/* Price Badge */}
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-md ${isSelected
                                                    ? 'bg-black/10 text-black'
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                }`}>
                                                ${show.showPrice}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs opacity-70">
                                            <MonitorPlay className="w-3 h-3" />
                                            <span className="truncate">
                                                {show.screen || "Screen 1"} • 2D
                                            </span>
                                        </div>

                                        {/* Selection Ring */}
                                        {isSelected && (
                                            <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none opacity-50"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- 3. ACTION BAR --- */}
                <div className='relative z-10 pt-6 mt-2 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4'>
                    <div className="hidden md:block">
                        <p className="text-gray-400 text-sm">
                            {selectedShowId
                                ? "Great choice! Proceed to select your seats."
                                : "Please select a preferred date and time slot."}
                        </p>
                    </div>

                    <button
                        onClick={onBookHandler}
                        disabled={!selectedShowId}
                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform ${selectedShowId
                                ? 'bg-primary text-white hover:bg-red-600 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        <TicketIcon className="w-5 h-5" />
                        <span>Book Seats</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DateSelect;