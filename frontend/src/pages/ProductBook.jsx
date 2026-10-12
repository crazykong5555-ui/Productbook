import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

const emptyForm = { producto: "", imagen: "", descripcion: "", valor: "", url: "" };

function safeLink(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

export default function ProductBook() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await API.get("/urls/");
      setProducts(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudieron cargar los productos.");
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...form, valor: form.valor === "" ? null : Number(form.valor) };
    try {
      if (editingId) await API.put(`/urls/${editingId}`, payload);
      else await API.post("/urls/", payload);
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo guardar el producto.");
    } finally {
      setBusy(false);
    }
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({ producto: product.producto || "", imagen: product.imagen || "", descripcion: product.descripcion || "", valor: product.valor ?? "", url: product.url || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await API.delete(`/urls/${id}`);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo eliminar el producto.");
    }
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Catálogo manual</p>
        <h1 className="mt-1 text-3xl font-bold">ProductBook</h1>
        <p className="mt-2 text-slate-600">Agrega productos y administra las tarjetas que aparecen en tu catálogo.</p>
      </div>

      <form onSubmit={submit} className="mb-9 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{editingId ? "Editar producto" : "Agregar producto"}</h2>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Nombre del producto<input required maxLength={255} value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
          <label className="text-sm font-medium">Precio<input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="Opcional" /></label>
          <label className="text-sm font-medium">URL de imagen<input type="url" value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="https://…" /></label>
          <label className="text-sm font-medium">Enlace del producto<input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="https://…" /></label>
          <label className="text-sm font-medium sm:col-span-2">Descripción<textarea rows="3" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
        </div>
        <div className="mt-4 flex gap-3">
          <button disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar producto"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Cancelar</button>}
        </div>
      </form>

      {products.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">Aún no hay productos. Agrega el primero usando el formulario.</div> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const link = safeLink(product.url);
            return <article key={product.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {safeLink(product.imagen) ? <img src={safeLink(product.imagen)} alt={product.producto} className="h-48 w-full bg-slate-100 object-cover" loading="lazy" /> : <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-200 text-5xl" aria-hidden="true">🛍️</div>}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{product.producto}</h2>{product.valor != null && <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">${Number(product.valor).toLocaleString("es-CO")}</span>}</div>
                {product.descripcion && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{product.descripcion}</p>}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  {link ? <a href={link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-700 hover:underline">Ver producto ↗</a> : <span />}
                  <div className="ml-auto flex gap-3"><button onClick={() => edit(product)} className="text-sm font-medium text-indigo-700 hover:underline">Editar</button><button onClick={() => remove(product.id)} className="text-sm font-medium text-red-600 hover:underline">Eliminar</button></div>
                </div>
              </div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
