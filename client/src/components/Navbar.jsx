import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const navigate = useNavigate()

    // 1. Get Context to make API calls
    const { axios, getToken, isAdmin } = useAppContext()
    const [hasFavorites, setHasFavorites] = useState(false)

    // 2. Check if user has favorites whenever they log in
    useEffect(() => {
        const checkFavorites = async () => {
            if (!user) {
                setHasFavorites(false);
                return;
            }

            try {
                const token = await getToken();
                // We reuse the existing endpoint to check array length
                const { data } = await axios.get("/api/user/favourites", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success && data.movies && data.movies.length > 0) {
                    setHasFavorites(true);
                } else {
                    setHasFavorites(false);
                }
            } catch (error) {
                console.error("Navbar check failed:", error);
                setHasFavorites(false);
            }
        };

        checkFavorites();
    }, [user, axios, getToken]); // Runs when user status changes

    // 3. Scroll Logic
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 50) { // Scroll down & past threshold
                    setShowNavbar(false);
                } else { // Scroll up
                    setShowNavbar(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);

        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, [lastScrollY]);


    return (
        <div className={`fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
            <Link to='/' className='max-md:flex-1'>
                <img src={assets.logo} alt='' className='w-36 h-auto' />
            </Link>

            <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium 
        max-md:text-lg z-50 flex flex-col md:flex-row items-center 
        max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen 
        min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border 
        border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>

                <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />

                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Home</Link>
                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/movies">Movies</Link>
                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/theaters">Theaters</Link>

                {
                    isAdmin && (
                        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/admin">Dashboard</Link>
                    )
                }

                {/* 3. Condition: Show only if user exists AND has favorites */}
                {user && hasFavorites && (
                    <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/favorite">Favorites</Link>
                )}
            </div>

            <div className='flex items-center gap-8'>
                <SearchIcon className='max-md:hidden w-6 h-6 cursor-pointer' />

                {
                    !user ? (
                        <button
                            onClick={openSignIn}
                            className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
                            Login
                        </button>
                    ) : (
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action label='My Bookings' labelIcon={<TicketPlus width={15} />} onClick={() => navigate('/my-bookings')} />
                            </UserButton.MenuItems>
                        </UserButton>
                    )
                }
            </div>

            <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
        </div>
    )
}

export default Navbar