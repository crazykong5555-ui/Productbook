import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import { useProductLink } from "../hooks/useProductLink";

const emptyForm = { producto: "", cantidad: 1, imagen: "", descripcion: "", valor: "", url: "" };

export default function ProductBook() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { openProductLink, sanitizeUrl } = useProductLink();

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await API.get("/urls/");
      setProducts(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudieron cargar los productos.");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      valor: form.valor === "" ? null : Number(form.valor),
      cantidad: form.cantidad === "" ? 1 : Math.max(0, parseInt(form.cantidad, 10) || 0),
    };
    try {
      if (editingId) await API.put(`/urls/${editingId}`, payload);
      else await API.post("/urls/", payload);
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      const networkMsg = requestError.message;
      setError(serverMsg || (networkMsg ? `Error: ${networkMsg}` : "No se pudo guardar el producto."));
    } finally {
      setBusy(false);
    }
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({
      producto: product.producto || "",
      cantidad: product.cantidad ?? 1,
      imagen: product.imagen || "",
      descripcion: product.descripcion || "",
      valor: product.valor ?? "",
      url: product.url || "",
    });
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

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

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
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium sm:col-span-2">
            Nombre del producto *
            <input required maxLength={255} value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <label className="text-sm font-medium">
            Cantidad en stock
            <input type="number" min="0" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <label className="text-sm font-medium">
            Precio
            <input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="Opcional" />
          </label>
          <label className="text-sm font-medium">
            URL de imagen
            <input type="url" value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="https://…" />
          </label>
          <label className="text-sm font-medium">
            Enlace del producto
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" placeholder="https://…" />
          </label>
          <label className="text-sm font-medium sm:col-span-3">
            Descripción
            <textarea rows="3" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar producto"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Cancelar</button>}
        </div>
      </form>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
          Aún no hay productos. Agrega el primero usando el formulario.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const providerLink = sanitizeUrl(product.url);
            const imageLink = sanitizeUrl(product.imagen);
            const hasProviderLink = Boolean(providerLink);
            const qty = product.cantidad ?? 1;

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md"
              >
                {/* Imagen del producto con evento onClick para abrir el enlace del proveedor mediante el hook useProductLink */}
                <div
                  onClick={() => hasProviderLink && openProductLink(product.url)}
                  onKeyDown={(e) => {
                    if (hasProviderLink && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      openProductLink(product.url);
                    }
                  }}
                  role={hasProviderLink ? "button" : undefined}
                  tabIndex={hasProviderLink ? 0 : undefined}
                  aria-label={hasProviderLink ? `Abrir página del proveedor de ${product.producto}` : undefined}
                  title={hasProviderLink ? "Haz clic para visitar la página del proveedor" : undefined}
                  className={`group relative overflow-hidden ${
                    hasProviderLink ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500" : ""
                  }`}
                >
                  {imageLink ? (
                    <img
                      src={imageLink}
                      alt={product.producto}
                      className={`h-48 w-full bg-slate-100 object-cover ${
                        hasProviderLink ? "transition-transform duration-300 group-hover:scale-105" : ""
                      }`}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`flex h-48 items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-200 text-5xl ${
                        hasProviderLink ? "transition-transform duration-300 group-hover:scale-105" : ""
                      }`}
                      aria-hidden="true"
                    >
                      🛍️
                    </div>
                  )}

                  {hasProviderLink && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow">
                        Visitar proveedor ↗
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">{product.producto}</h2>
                    <div className="flex flex-col items-end gap-1">
                      {product.valor != null && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                          ${Number(product.valor).toLocaleString("es-CO")}
                        </span>
                      )}
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          qty === 0
                            ? "bg-rose-50 text-rose-700"
                            : qty <= 3
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {qty === 0 ? "Agotado" : `${qty} ud.`}
                      </span>
                    </div>
                  </div>
                  {product.descripcion && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{product.descripcion}</p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    {providerLink ? (
                      <button
                        type="button"
                        onClick={() => openProductLink(product.url)}
                        className="text-sm font-semibold text-indigo-700 hover:underline"
                      >
                        Ver producto ↗
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="ml-auto flex gap-3">
                      <button
                        onClick={() => edit(product)}
                        className="text-sm font-medium text-indigo-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(product.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
