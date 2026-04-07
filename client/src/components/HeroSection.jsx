import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircleIcon, StarIcon, TicketIcon, ChevronLeft, ChevronRight, CalendarIcon, ClockIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';

const glows = [
    'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(220,38,38,0.22) 0%, transparent 70%)',
    'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(180,130,80,0.22) 0%, transparent 70%)',
    'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(80,160,200,0.22) 0%, transparent 70%)',
    'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(60,140,80,0.22) 0%, transparent 70%)',
    'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(200,150,180,0.22) 0%, transparent 70%)',
];

const AUTO_INTERVAL = 6000;

export default function HeroSection() {
    const navigate = useNavigate();
    const { shows } = useAppContext();
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/original";

    const uniqueMovies = useMemo(() => {
        const unique = [];
        const seenIds = new Set();
        if (shows && Array.isArray(shows)) {
            shows.forEach((show) => {
                if (show.movie && !seenIds.has(show.movie._id)) {
                    seenIds.add(show.movie._id);
                    unique.push(show.movie);
                }
            });
        }
        return unique.slice(0, 5);
    }, [shows]);

    const TOTAL = uniqueMovies.length;
    const [current, setCurrent] = useState(0);
    const [progressVal, setProgressVal] = useState(0);

    const autoTimerRef = useRef(null);
    const progressTimerRef = useRef(null);
    const touchX = useRef(null);

    useEffect(() => {
        if (TOTAL === 0) return;
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = setInterval(() => {
            setCurrent((prev) => (prev + 1) % TOTAL);
        }, AUTO_INTERVAL);
        return () => clearInterval(autoTimerRef.current);
    }, [TOTAL, current]);

    useEffect(() => {
        if (TOTAL === 0) return;
        setProgressVal(0);
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
            setProgressVal((prev) => {
                const next = prev + (100 / (AUTO_INTERVAL / 100));
                if (next >= 100) clearInterval(progressTimerRef.current);
                return Math.min(next, 100);
            });
        }, 100);
        return () => clearInterval(progressTimerRef.current);
    }, [current, TOTAL]);

    const goTo = (idx) => {
        if (TOTAL === 0) return;
        setCurrent((idx + TOTAL) % TOTAL);
    };

    const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (TOTAL === 0) return;
            if (e.key === 'ArrowLeft') goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [current, TOTAL]);

    if (!shows) {
        return (
            <div className="h-screen bg-[#0a0b0f] flex flex-col items-center justify-center text-white">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium tracking-wide animate-pulse">Loading Movies...</p>
            </div>
        );
    }

    if (TOTAL === 0) {
        return (
            <div
                className='relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-cover bg-center'
                style={{ backgroundImage: 'url("/backgroundImage.png")' }}
            >
                <div className="absolute inset-0 bg-black/80"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                        <TicketIcon className="w-10 h-10 text-gray-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Welcome to CineBook</h1>
                    <p className="text-gray-400 text-lg mb-8">Currently, there are no actively scheduled shows. Please check back later for the latest blockbusters and events.</p>
                    <button
                        onClick={() => navigate('/movies')}
                        className="px-8 py-3 bg-primary hover:bg-red-600 text-white rounded-full font-bold tracking-wide transition shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:-translate-y-1"
                    >
                        Browse Catalog
                    </button>
                </div>
            </div>
        );
    }

    // Coverflow style — tighter, more refined depth
    const getSlideStyle = (index) => {
        let offset = (index - current + TOTAL) % TOTAL;
        if (offset > Math.floor(TOTAL / 2)) offset -= TOTAL;

        const absOffset = Math.abs(offset);
        const direction = offset > 0 ? 1 : -1;

        if (offset === 0) {
            return {
                transform: 'translateX(0) scale(1) translateZ(0) rotateY(0deg)',
                zIndex: 30,
                opacity: 1,
                filter: 'brightness(1) blur(0px)',
            };
        }

        const translateX = direction * (absOffset * 62) + '%';
        const scale = Math.pow(0.82, absOffset);
        const opacity = Math.max(1 - (absOffset * 0.45), 0);
        const brightness = Math.max(1 - (absOffset * 0.4), 0.25);
        const blur = absOffset * 1.5;
        const rotateY = direction * -8 * absOffset;

        return {
            transform: `translateX(${translateX}) scale(${scale}) translateZ(${-absOffset * 150}px) rotateY(${rotateY}deg)`,
            zIndex: 20 - absOffset,
            opacity,
            filter: `brightness(${brightness}) blur(${blur}px)`,
        };
    };

    return (
        <div
            className='relative w-full h-screen bg-[#0a0b0f] overflow-hidden select-none font-sans'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ perspective: '1800px' }}
        >
            <style>{`
        /* ── Carousel Core ── */
        .carousel-container {
          position: absolute;
          top: 5rem; left: 0; right: 0;
          bottom: 7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          transform-style: preserve-3d;
        }

        /* ── Slide ── */
        .slide {
          position: absolute;
          width: min(78vw, 1300px);
          height: min(68vh, 640px);
          border-radius: 28px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 0.7s ease,
                      filter 0.7s ease;
          will-change: transform, opacity, filter;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04);
        }

        .slide.active {
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.9),
                      0 0 0 1px rgba(255,255,255,0.08),
                      0 0 60px -10px rgba(220,38,38,0.15);
        }

        .slide-bg {
          position: absolute;
          inset: -10px;
          background-size: cover;
          background-position: center;
          transition: transform 10s ease-out;
        }
        .slide.active .slide-bg { transform: scale(1.06); }

        /* Refined gradient — darker on left for text legibility */
        .slide-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(10,11,15,0.92) 0%, rgba(10,11,15,0.55) 45%, rgba(10,11,15,0.1) 75%, transparent 100%),
            linear-gradient(180deg, transparent 40%, rgba(10,11,15,0.7) 100%);
        }

        /* ── Content ── */
        .slide-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(2rem, 4vw, 3.5rem) clamp(2rem, 5vw, 4rem);
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s 0.35s ease, transform 0.6s 0.35s ease;
          pointer-events: none;
        }
        .slide.active .slide-content {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        .content-inner {
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Glass poster ── */
        .glass-poster-card {
          position: absolute;
          right: clamp(2rem, 4vw, 3.5rem);
          bottom: clamp(2rem, 4vw, 3.5rem);
          width: clamp(140px, 14vw, 190px);
          aspect-ratio: 2/3;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            0 20px 50px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.06),
            inset 0 1px 0 rgba(255,255,255,0.2);
          opacity: 0;
          transform: translateY(30px) scale(0.94);
          transition: opacity 0.6s 0.5s ease, transform 0.6s 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .slide.active .glass-poster-card {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .glass-poster-card img {
          width: 100%; height: 100%; object-fit: cover;
        }

        /* Mini title for inactive */
        .slide-mini-title {
          position: absolute;
          bottom: 2rem;
          left: 1.5rem;
          right: 1.5rem;
          font-weight: 800;
          color: rgba(255,255,255,0.95);
          line-height: 1.2;
          text-shadow: 0 2px 16px rgba(0,0,0,1);
          text-align: center;
          font-size: 1.35rem;
          letter-spacing: -0.01em;
          transition: opacity 0.4s;
        }
        .slide.active .slide-mini-title { opacity: 0; }

        /* Progress bar */
        .slide-progress {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.4s;
        }
        .slide.active .slide-progress { opacity: 1; }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #dc2626, #ef4444);
          width: 0%;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(220,38,38,0.8);
        }

        /* ── Bottom control bar ── */
        .control-bar {
          position: absolute;
          bottom: 2.25rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.65rem 0.65rem;
          background: rgba(20,22,28,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 50;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .arrow-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .arrow-btn:hover {
          background: #dc2626;
          border-color: #dc2626;
          color: white;
          transform: scale(1.08);
          box-shadow: 0 0 24px rgba(220,38,38,0.5);
        }

        .dots-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0 0.5rem;
        }

        /* Counter — bottom right, away from navbar */
        .slide-counter {
          position: absolute;
          bottom: 2.75rem;
          right: 2.5rem;
          z-index: 40;
          font-family: ui-monospace, monospace;
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .slide-counter .num { color: white; font-weight: 700; font-size: 1.1rem; }
        .slide-counter .divider { width: 40px; height: 1px; background: rgba(255,255,255,0.3); }

        /* Responsive */
        @media (max-width: 1024px) {
          .slide { width: 82vw; height: 62vh; }
          .glass-poster-card { width: 130px; }
        }
        @media (max-width: 640px) {
          .slide { width: 90vw; height: 64vh; border-radius: 22px; }
          .glass-poster-card { display: none; }
          .slide-counter { display: none; }
          .control-bar { bottom: 1.5rem; gap: 1rem; }
          .arrow-btn { width: 38px; height: 38px; }
        }
      `}</style>

            {/* Ambient glow */}
            <div
                className="absolute inset-0 z-0 transition-all duration-1000 opacity-80"
                style={{ background: glows[current % glows.length] }}
            />

            {/* Counter */}
            <div className="slide-counter">
                <span className="num">{String(current + 1).padStart(2, '0')}</span>
                <span className="divider"></span>
                <span>{String(TOTAL).padStart(2, '0')}</span>
            </div>

            <div className="carousel-container z-10">
                {uniqueMovies.map((movie, idx) => {
                    const isActive = idx === current;
                    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
                    const runtime = movie.runtime ? timeFormat(movie.runtime) : "N/A";
                    const rating = movie.vote_average?.toFixed(1) || "0.0";

                    return (
                        <div
                            key={movie._id + idx}
                            className={`slide ${isActive ? 'active' : ''}`}
                            style={getSlideStyle(idx)}
                            onClick={() => { if (!isActive) goTo(idx); }}
                        >
                            <div
                                className="slide-bg"
                                style={{ backgroundImage: `url('${image_base_url}${movie.backdrop_path || movie.poster_path}')` }}
                            ></div>
                            <div className="slide-overlay"></div>

                            {/* Active Content */}
                            <div className="slide-content">
                                <div className="content-inner">
                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase">
                                        {movie.genres?.slice(0, 3).map((g, gi) => (
                                            <span key={gi} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur-md">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Title */}
                                    <h2 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-white drop-shadow-2xl tracking-tight">
                                        {movie.title}
                                    </h2>

                                    {/* Meta row — unified pill style */}
                                    <div className="flex items-center flex-wrap gap-2.5 text-xs sm:text-sm font-medium text-white/85">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md">
                                            <StarIcon className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-white font-bold">{rating}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md">
                                            <ClockIcon className="w-3.5 h-3.5 text-white/70" />
                                            <span>{runtime}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md">
                                            <CalendarIcon className="w-3.5 h-3.5 text-white/70" />
                                            <span>{releaseYear}</span>
                                        </div>
                                    </div>

                                    {/* Overview */}
                                    <p className="text-sm sm:text-base font-normal text-white/70 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl">
                                        {movie.overview}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie._id}`); scrollTo(0, 0); }}
                                            className="group flex items-center gap-2 bg-primary hover:bg-red-600 text-white px-7 py-3.5 rounded-full text-sm sm:text-base font-bold tracking-wide transition-all shadow-[0_12px_32px_-8px_rgba(220,38,38,0.6)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(220,38,38,0.8)]"
                                        >
                                            <TicketIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            Book Now
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie._id}`); scrollTo(0, 0); }}
                                            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold transition-all backdrop-blur-md hover:-translate-y-0.5"
                                        >
                                            <PlayCircleIcon className="w-5 h-5" />
                                            Trailer
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Glass Poster */}
                            <div className="glass-poster-card">
                                <img src={`${image_base_url}${movie.poster_path}`} alt={movie.title} />
                            </div>

                            {/* Mini title */}
                            <div className="slide-mini-title">{movie.title}</div>

                            {/* Progress */}
                            <div className="slide-progress">
                                <div className="progress-fill" style={{ width: isActive ? `${progressVal}%` : '0%' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Unified control bar */}
            <div className="control-bar">
                <button className="arrow-btn" onClick={() => goTo(current - 1)} aria-label="Previous">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="dots-row">
                    {uniqueMovies.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => goTo(idx)}
                            className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${idx === current
                                    ? 'w-9 bg-primary shadow-[0_0_12px_rgba(220,38,38,0.8)]'
                                    : 'w-2 bg-white/30 hover:bg-white/60'
                                }`}
                        ></div>
                    ))}
                </div>
                <button className="arrow-btn" onClick={() => goTo(current + 1)} aria-label="Next">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}