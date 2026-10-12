import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo iniciar sesión.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <form onSubmit={handleLogin} className="w-full rounded-2xl bg-white p-8 text-slate-900 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold">Iniciar sesión</h1>
        <p className="mb-6 text-slate-500">Accede a tu espacio de ProductBook.</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-1 block text-sm font-medium" htmlFor="login-email">Correo electrónico</label>
        <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mb-4 w-full rounded-lg border border-slate-300 p-3" />
        <label className="mb-1 block text-sm font-medium" htmlFor="login-password">Contraseña</label>
        <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mb-6 w-full rounded-lg border border-slate-300 p-3" />
        <button className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white hover:bg-indigo-700">Iniciar sesión</button>
        <p className="mt-5 text-center text-sm text-slate-600">¿No tienes cuenta? <Link className="font-semibold text-indigo-700" to="/register">Regístrate</Link></p>
      </form>
    </div>
  );
}
