import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

/* ===================== AXIOS CONFIG ===================== */
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/* ===================== CONTEXT ===================== */
export const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(null);
    const [isAdminLoading, setIsAdminLoading] = useState(true);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    /* ===================== CHECK ADMIN ===================== */
    const fetchIsAdmin = async () => {
        setIsAdminLoading(true);
        try {
            const token = await getToken();

            const { data } = await axios.get("/api/admin/is-admin", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith("/admin")) {
                navigate("/");
                toast.error("You are not authorized to access admin dashboard");
            }
        } catch (error) {
            console.error("Admin check failed:", error);
            // If the check fails (network error), assume they are NOT admin
            setIsAdmin(false);
        } finally {
            // ✅ CRITICAL FIX: This runs whether success OR error
            setIsAdminLoading(false);
        }
    };

    /* ===================== FETCH SHOWS ===================== */
    const fetchShows = async () => {
        try {
            const { data } = await axios.get("/api/shows/all");

            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Fetch shows failed:", error);
        }
    };

    /* ===================== FETCH FAVORITES ===================== */
    const fetchFavoriteMovies = async () => {
        try {
            const token = await getToken();

            const { data } = await axios.get("/api/user/favourites", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (data.success) {
                setFavoriteMovies(data.movies);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Fetch favorites failed:", error);
        }
    };

    /* ===================== EFFECTS ===================== */
    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        if (user) {
            fetchIsAdmin();
            fetchFavoriteMovies();
        }
    }, [user]);

    /* ===================== CONTEXT VALUE ===================== */
    const value = {
        axios,
        user,
        isAdmin,
        shows,
        favoriteMovies,
        fetchIsAdmin,
        fetchFavoriteMovies,
        navigate,
        getToken,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

/* ===================== CUSTOM HOOK ===================== */
export const useAppContext = () => {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error(
            "useAppContext must be used within AppContextProvider"
        );
    }

    return context;
};
