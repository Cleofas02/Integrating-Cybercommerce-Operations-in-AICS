import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import Brand from "./Brand.jsx";

const link = ({ isActive }) =>
  "rounded-full px-4 py-2 font-medium " + (isActive ? "bg-white text-navy" : "text-white/80 hover:text-white");

export default function Layout() {
  const { user, logout, cartCount } = useStore();
  const nav = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="bg-navy">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-auto"><Brand light /></span>

          {user?.role === "student" && (
            <>
              <NavLink to="/menu" className={link}>Menu</NavLink>
              <NavLink to="/cart" className={link}>
                Cart{cartCount > 0 && <span className="ml-2 rounded-full bg-orange px-2 text-sm text-white">{cartCount}</span>}
              </NavLink>
              <NavLink to="/tickets" className={link}>My tickets</NavLink>
            </>
          )}

          {user && (
            <button
              onClick={async () => { await logout(); nav("/login"); }}
              className="ml-2 rounded-full border border-white/40 px-4 py-2 text-white/90 hover:bg-white/10"
            >
              Log out
            </button>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
