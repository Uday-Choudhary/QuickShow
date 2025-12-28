import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";
import {
  LayoutDashboardIcon,
  PlusSquareIcon,
  ListIcon,
  ListCollapseIcon,
  LogOutIcon,
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";

const AdminSideBar = () => {
  const { signOut } = useClerk();

  const user = {
    firstName: "Admin",
    lastName: "Panel",
    imageUrl: assets.profile,
  };

  const adminNavlinks = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboardIcon },
    { name: "Add Shows", path: "/admin/add-shows", icon: PlusSquareIcon },
    { name: "List Shows", path: "/admin/list-shows", icon: ListIcon },
    { name: "Bookings", path: "/admin/list-bookings", icon: ListCollapseIcon },
  ];

  return (
    <aside className="h-[calc(100vh-64px)] w-20 md:w-64 bg-[#0f1014] border-r border-gray-800 flex flex-col sticky top-[64px] transition-all duration-300">

      {/* ================= PROFILE ================= */}
      <div className="px-4 pt-6 pb-5 flex flex-col items-center border-b border-gray-800">
        <img
          src={user.imageUrl}
          alt="Admin"
          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-primary/40"
        />

        <div className="mt-3 text-center max-md:hidden">
          <p className="text-sm font-semibold text-white">
            {user.firstName} {user.lastName}
          </p>
          <span className="text-xs text-gray-500 tracking-wide">
            Administrator
          </span>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {adminNavlinks.map((link, index) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={index}
              to={link.path}
              end
              className={({ isActive }) =>
                `
                relative group flex items-center gap-3 px-3 py-3 rounded-lg
                transition-all duration-200 ease-out
                ${isActive
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary" />
                  )}

                  {/* Icon */}
                  <div className="flex items-center justify-center w-6 h-6 shrink-0">
                    <Icon
                      className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "group-hover:text-white"
                        }`}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Label */}
                  <span className="font-medium text-sm max-md:hidden whitespace-nowrap">
                    {link.name}
                  </span>

                  {/* Tooltip (mobile) */}
                  <div className="md:hidden absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-700 shadow-lg">
                    {link.name}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ================= LOGOUT ================= */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut()}
          className="group flex items-center gap-3 w-full px-3 py-3 rounded-lg
          text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <div className="flex items-center justify-center w-6 h-6">
            <LogOutIcon className="w-5 h-5" />
          </div>
          <span className="font-medium text-sm max-md:hidden">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSideBar;
