import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // <--- 1. Import Toast

import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";
import Loading from "../../components/Loading";

import { useAppContext } from "../../context/AppContext";

const Layout = () => {
  const { isAdmin, isAdminLoading } = useAppContext();
  const navigate = useNavigate();

  // ✅ Redirect side-effect
  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      // 2. Show Error Toast before redirecting
      toast.error("You are not authorized to access admin dashboard");
      navigate("/", { replace: true });
    }
  }, [isAdminLoading, isAdmin, navigate]);

  // 🔄 Still checking admin
  if (isAdminLoading || isAdmin === null) {
    return <Loading />;
  }

  // 🚫 Non-admin (redirect handled above)
  if (!isAdmin) {
    return null;
  }

  // ✅ Verified admin
  return (
    <>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 px-4 py-10 h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Layout;