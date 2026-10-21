import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to={user ? "/" : "/login"} className="text-xl font-extrabold tracking-tight text-indigo-700">
          ProductBook
        </Link>
        {user ? (
          <div className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Inicio
            </NavLink>
            <NavLink to="/agenda" className={navClass}>
              Agenda
            </NavLink>
            <NavLink to="/productbook" className={navClass}>
              ProductBook
            </NavLink>
            <NavLink to="/inventario" className={navClass}>
              Inventario
            </NavLink>
            <span className="ml-2 hidden text-sm font-medium text-slate-500 sm:inline">
              {user.nombre}
            </span>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
