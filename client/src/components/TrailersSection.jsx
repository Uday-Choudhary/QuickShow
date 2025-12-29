import React, { useState, useEffect } from 'react'
import YouTube from 'react-youtube'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon, Film } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const TrailersSection = () => {
    const [trailers, setTrailers] = useState([])
    const [currentTrailer, setCurrentTrailer] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrailers = async () => {
            try {
                const { data } = await axios.get(
                    import.meta.env.VITE_BASE_URL + '/api/shows/trailers'
                )

                if (data.success && data.trailers?.length) {
                    setTrailers(data.trailers)
                    setCurrentTrailer(data.trailers[0])
                }
            } catch (error) {
                console.error(error)
                toast.error('Failed to load trailers')
            } finally {
                setLoading(false)
            }
        }

        fetchTrailers()
    }, [])

    // --- Loading Skeleton ---
    if (loading) {
        return (
            <div className="py-24 max-w-7xl mx-auto px-6 animate-pulse">
                <div className="h-8 w-64 bg-gray-800/50 rounded-full mx-auto mb-10"></div>
                <div className="aspect-video w-full max-w-5xl mx-auto bg-gray-800/50 rounded-2xl mb-10"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-video bg-gray-800/50 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    // --- Empty State ---
    if (!currentTrailer) {
        return (
            <div className="py-32 flex flex-col items-center justify-center text-gray-500">
                <Film className="w-16 h-16 mb-4 opacity-20" />
                <p>No trailers available</p>
            </div>
        )
    }

    // --- YouTube Options ---
    const opts = {
        height: '100%', // Responsive height
        width: '100%',
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
    }

    return (
        <section className="relative px-6 md:px-12 lg:px-20 py-24 overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <BlurCircle top="-10%" left="20%" className="opacity-20" />
                <BlurCircle bottom="-10%" right="-5%" className="opacity-20" />
            </div>

            {/* Header */}
            <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Coming Soon</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Watch Official Trailers
                </h2>
                <p className="text-gray-400 mt-4 text-base md:text-lg">
                    Get a sneak peek at the blockbusters hitting theaters this month.
                </p>
            </div>

            {/* Main Player */}
            <div className="relative z-10 max-w-5xl mx-auto mb-16">
                {/* Glow Effect behind player */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
                    <YouTube
                        videoId={currentTrailer.key}
                        opts={opts}
                        className="w-full h-full absolute inset-0"
                        iframeClassName="w-full h-full"
                    />
                </div>

                <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{currentTrailer.title}</h3>
                        <p className="text-gray-400 mt-1">{currentTrailer.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Thumbnails List */}
            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="flex md:grid md:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible pb-8 md:pb-0 px-2 scrollbar-hide snap-x">
                    {trailers.map((trailer) => {
                        const isActive = currentTrailer.id === trailer.id
                        return (
                            <button
                                key={trailer.id}
                                onClick={() => setCurrentTrailer(trailer)}
                                className={`
                                    group relative min-w-[260px] md:min-w-0 rounded-xl overflow-hidden transition-all duration-500 ease-out text-left snap-start
                                    ${isActive
                                        ? 'ring-2 ring-orange-500 shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] scale-100 z-10'
                                        : 'opacity-60 hover:opacity-100 hover:-translate-y-2 hover:shadow-xl scale-95 hover:scale-100'
                                    }
                                `}
                            >
                                <div className="aspect-video w-full relative">
                                    <img
                                        src={trailer.image}
                                        alt={trailer.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Dark Overlay */}
                                    <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'group-hover:opacity-20'}`} />

                                    {/* Play Icon - Centered */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PlayCircleIcon
                                            className={`w-10 h-10 text-white drop-shadow-lg transition-all duration-300 
                                            ${isActive ? 'opacity-0 scale-50' : 'group-hover:scale-110'}`}
                                        />
                                    </div>
                                </div>

                                {/* Title on Thumbnail */}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                                    <p className={`text-sm font-medium text-white truncate transition-colors ${isActive ? 'text-orange-400' : ''}`}>
                                        {trailer.title}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default TrailersSection