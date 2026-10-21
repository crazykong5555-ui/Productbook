import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState("");

  return (
    <section className="mx-auto max-w-5xl py-12 text-center sm:py-20">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Tu espacio de trabajo</p>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Hola, {user?.nombre}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
        Busca en la web y mantén tus contactos, catálogo y existencias de productos organizados.
      </p>

      <form
        action="https://www.google.com/search"
        method="GET"
        target="_blank"
        rel="noreferrer"
        className="mx-auto mt-9 flex max-w-2xl rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500"
      >
        <label className="sr-only" htmlFor="google-search">Buscar en Google</label>
        <input
          id="google-search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en Google…"
          className="min-w-0 flex-1 rounded-xl px-4 py-3 outline-none"
        />
        <button className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
          Buscar
        </button>
      </form>

      <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
        <Link
          to="/agenda"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">👥</span>
          <h2 className="mt-3 text-xl font-bold">Agenda</h2>
          <p className="mt-1 text-slate-600">Administra nombres, teléfonos y correos de tus contactos.</p>
        </Link>
        <Link
          to="/productbook"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">🛍️</span>
          <h2 className="mt-3 text-xl font-bold">ProductBook</h2>
          <p className="mt-1 text-slate-600">Guarda productos manualmente y muéstralos en tarjetas de catálogo.</p>
        </Link>
        <Link
          to="/inventario"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">📦</span>
          <h2 className="mt-3 text-xl font-bold">Inventario</h2>
          <p className="mt-1 text-slate-600">Controla existencias, valoración y busca productos por nombre.</p>
        </Link>
      </div>
    </section>
  );
}
