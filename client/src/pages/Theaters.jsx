import React from 'react';
import { MapPinIcon, FilmIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Theaters = () => {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white pt-20 pb-12'>
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className='relative z-10 flex flex-col items-center text-center px-6 max-w-3xl w-full'>
                {/* Icon Wrapper */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gray-900/60 rounded-full flex items-center justify-center ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <MapPinIcon className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center">
                        <FilmIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Sparkles className="absolute -bottom-4 -left-4 w-6 h-6 text-yellow-500 animate-pulse" />
                </div>

                {/* Typography */}
                <h1 className='text-5xl md:text-6xl font-black tracking-tight mb-6 drop-shadow-lg text-white'>
                    Theaters <span className="text-primary">Network</span>
                </h1>
                
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                    <p className="text-sm font-bold tracking-wider uppercase text-gray-300">Coming Soon</p>
                </div>

                <p className='text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl'>
                    We are working hard to expand our platform to directly integrate with all your favorite local and international theater chains! Soon, you'll be able to view real-time showtimes, explore food & beverage menus, and book elite seating directly through our enhanced venue maps.
                </p>

                {/* Action Button */}
                <button 
                  onClick={() => navigate('/movies')}
                  className="px-8 py-3.5 bg-primary hover:bg-red-600 text-white rounded-full text-lg font-bold tracking-wide transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(220,38,38,0.5)]"
                >
                  Browse Movies Instead
                </button>
            </div>
            
            {/* Abstract Decorative Elements */}
            <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
    )
}

export default Theaters
