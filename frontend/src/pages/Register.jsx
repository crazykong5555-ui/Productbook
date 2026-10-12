import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    try {
      await API.post("/auth/register", form);
      const { data } = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white p-8 text-slate-900 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-6 text-slate-500">Organiza tus contactos y productos en un solo lugar.</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-1 block text-sm font-medium" htmlFor="register-name">Nombre</label>
        <input id="register-name" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} autoComplete="name" maxLength={100} required className="mb-4 w-full rounded-lg border border-slate-300 p-3" />
        <label className="mb-1 block text-sm font-medium" htmlFor="register-email">Correo electrónico</label>
        <input id="register-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required className="mb-4 w-full rounded-lg border border-slate-300 p-3" />
        <label className="mb-1 block text-sm font-medium" htmlFor="register-password">Contraseña</label>
        <input id="register-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength={8} maxLength={72} required className="mb-4 w-full rounded-lg border border-slate-300 p-3" />
        <label className="mb-1 block text-sm font-medium" htmlFor="confirm-password">Confirmar contraseña</label>
        <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={72} required className="mb-6 w-full rounded-lg border border-slate-300 p-3" />
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? "Creando cuenta…" : "Registrarme"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link className="font-semibold text-indigo-700" to="/login">Inicia sesión</Link></p>
      </form>
    </div>
  );
}
