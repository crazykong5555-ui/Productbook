import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useProductLink } from "../hooks/useProductLink";

const emptyProductForm = {
  producto: "",
  cantidad: 1,
  valor: "",
  url: "",
  imagen: "",
  descripcion: "",
};

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Búsqueda y Filtros
  const [searchName, setSearchName] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  // Modales y Formularios
  const [modalMode, setModalMode] = useState(null); // 'create_product', 'edit_product', 'load_stock', 'batch_stock'
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProduct, setEditingProduct] = useState(null);

  // Formulario de carga manual de existencias (para 1 producto)
  const [stockLoadForm, setStockLoadForm] = useState({
    productId: "",
    mode: "add", // 'add' (sumar) o 'set' (fijar exacto)
    cantidad: 1,
    motivo: "Compra / Reabastecimiento",
  });

  // Estado para edición en línea (inline edit de stock)
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineStockValue, setInlineStockValue] = useState("");

  // Estado para carga masiva de stock
  const [batchDraft, setBatchDraft] = useState({});

  const { openProductLink, sanitizeUrl } = useProductLink();

  // Cargar lista de productos/inventario
  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/urls/");
      setItems(data);
      setError("");
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      const networkMsg = requestError.message;
      setError(serverMsg || (networkMsg ? `Error: ${networkMsg}` : "No se pudo cargar el inventario."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Mensaje flash de confirmación
  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ==========================================
  // OPERACIÓN 1: CREATE / UPDATE Producto completo
  // ==========================================
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const payload = {
      producto: productForm.producto.trim(),
      cantidad: Math.max(0, parseInt(productForm.cantidad, 10) || 0),
      valor: productForm.valor === "" ? null : Number(productForm.valor),
      url: productForm.url.trim(),
      imagen: productForm.imagen.trim(),
      descripcion: productForm.descripcion.trim(),
    };

    try {
      if (editingProduct) {
        await API.put(`/urls/${editingProduct.id}`, payload);
        flashSuccess(`Producto "${payload.producto}" actualizado correctamente.`);
      } else {
        await API.post("/urls/", payload);
        flashSuccess(`Producto "${payload.producto}" creado con ${payload.cantidad} unidades.`);
      }
      setProductForm(emptyProductForm);
      setEditingProduct(null);
      setModalMode(null);
      await loadInventory();
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al guardar el producto.");
    } finally {
      setBusy(false);
    }
  };

  // Abrir modal para crear producto nuevo
  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setModalMode("create_product");
    setError("");
  };

  // Abrir modal para editar producto completo
  const openEditModal = (item) => {
    setEditingProduct(item);
    setProductForm({
      producto: item.producto || "",
      cantidad: item.cantidad ?? 1,
      valor: item.valor ?? "",
      url: item.url || "",
      imagen: item.imagen || "",
      descripcion: item.descripcion || "",
    });
    setModalMode("edit_product");
    setError("");
  };

  // ==========================================
  // OPERACIÓN 2: CARGAR EXISTENCIAS MANUALMENTE (Modal dedicado)
  // ==========================================
  const openLoadStockModal = (item = null) => {
    setStockLoadForm({
      productId: item ? String(item.id) : (items[0] ? String(items[0].id) : ""),
      mode: "add",
      cantidad: 1,
      motivo: "Reabastecimiento de existencias",
    });
    setModalMode("load_stock");
    setError("");
  };

  const handleStockLoadSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const targetId = parseInt(stockLoadForm.productId, 10);
    const targetProduct = items.find((p) => p.id === targetId);

    if (!targetProduct) {
      setError("Selecciona un producto válido para cargar existencias.");
      setBusy(false);
      return;
    }

    const qty = Math.max(0, parseInt(stockLoadForm.cantidad, 10) || 0);
    const newQty = stockLoadForm.mode === "add" ? (targetProduct.cantidad || 0) + qty : qty;

    try {
      await API.patch(`/urls/${targetId}/stock`, { cantidad: newQty });
      flashSuccess(
        `Existencias de "${targetProduct.producto}" actualizadas: ${targetProduct.cantidad} → ${newQty} uds.`
      );
      setModalMode(null);
      await loadInventory();
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al cargar las existencias.");
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // OPERACIÓN 3: AJUSTE RÁPIDO Y EDICIÓN INLINE
  // ==========================================
  // Incremento / Decremento rápido (+1, -1, +5, +10)
  const adjustStock = async (item, delta) => {
    const current = item.cantidad || 0;
    const newQty = Math.max(0, current + delta);
    if (newQty === current) return;

    try {
      // Actualización optimista en el estado
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, cantidad: newQty } : p))
      );
      await API.patch(`/urls/${item.id}/stock`, { cantidad: newQty });
      flashSuccess(`"${item.producto}": stock ajustado a ${newQty} uds.`);
    } catch (requestError) {
      // Revertir en caso de fallo
      await loadInventory();
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "No se pudo actualizar el stock.");
    }
  };

  // Guardar edición directa en celda (inline edit)
  const saveInlineStock = async (item) => {
    const parsed = parseInt(inlineStockValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setInlineEditingId(null);
      return;
    }

    try {
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, cantidad: parsed } : p))
      );
      setInlineEditingId(null);
      await API.patch(`/urls/${item.id}/stock`, { cantidad: parsed });
      flashSuccess(`"${item.producto}": existencia establecida en ${parsed} uds.`);
    } catch (requestError) {
      await loadInventory();
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al actualizar la existencia.");
    }
  };

  // ==========================================
  // OPERACIÓN 4: CARGA MASIVA DE EXISTENCIAS (BATCH)
  // ==========================================
  const openBatchModal = () => {
    const draft = {};
    items.forEach((item) => {
      draft[item.id] = item.cantidad ?? 0;
    });
    setBatchDraft(draft);
    setModalMode("batch_stock");
    setError("");
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const payload = Object.entries(batchDraft).map(([id, cantidad]) => ({
      id: parseInt(id, 10),
      cantidad: Math.max(0, parseInt(cantidad, 10) || 0),
    }));

    try {
      await API.post("/urls/batch-stock", payload);
      flashSuccess(`Se actualizaron las existencias de ${payload.length} productos.`);
      setModalMode(null);
      await loadInventory();
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al guardar el lote de existencias.");
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // OPERACIÓN 5: DELETE (Vaciar stock o Eliminar producto)
  // ==========================================
  // Poner stock a 0 (Marcar como Agotado)
  const resetStockToZero = async (item) => {
    if (!window.confirm(`¿Vaciar existencias de "${item.producto}" y marcarlo como agotado (0 unidades)?`)) {
      return;
    }
    try {
      await API.patch(`/urls/${item.id}/stock`, { cantidad: 0 });
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, cantidad: 0 } : p))
      );
      flashSuccess(`"${item.producto}" marcado como agotado.`);
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al vaciar existencias.");
    }
  };

  // Eliminar producto completamente
  const handleDeleteProduct = async (item) => {
    if (!window.confirm(`¿Eliminar completamente "${item.producto}" de la base de datos?`)) {
      return;
    }
    try {
      await API.delete(`/urls/${item.id}`);
      flashSuccess(`"${item.producto}" eliminado.`);
      await loadInventory();
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.error;
      setError(serverMsg || "Error al eliminar el producto.");
    }
  };

  // Métricas
  const stats = useMemo(() => {
    const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    const totalValue = items.reduce(
      (acc, curr) => acc + (Number(curr.cantidad) || 0) * (Number(curr.valor) || 0),
      0
    );
    const outOfStock = items.filter((p) => (p.cantidad || 0) <= 0).length;
    const lowStock = items.filter((p) => (p.cantidad || 0) > 0 && (p.cantidad || 0) <= 3).length;

    return {
      totalProducts: items.length,
      totalUnits,
      totalValue,
      outOfStock,
      lowStock,
    };
  }, [items]);

  // Filtrado y ordenamiento por nombre
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchName.trim()) {
      const q = searchName.toLowerCase().trim();
      result = result.filter((p) => (p.producto || "").toLowerCase().includes(q));
    }

    if (stockFilter === "in_stock") {
      result = result.filter((p) => (p.cantidad || 0) > 3);
    } else if (stockFilter === "low_stock") {
      result = result.filter((p) => (p.cantidad || 0) > 0 && (p.cantidad || 0) <= 3);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter((p) => (p.cantidad || 0) <= 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (a.producto || "").localeCompare(b.producto || "", undefined, { sensitivity: "base" });
        case "name_desc":
          return (b.producto || "").localeCompare(a.producto || "", undefined, { sensitivity: "base" });
        case "qty_desc":
          return (b.cantidad || 0) - (a.cantidad || 0);
        case "qty_asc":
          return (a.cantidad || 0) - (b.cantidad || 0);
        case "price_desc":
          return (b.valor || 0) - (a.valor || 0);
        case "total_desc":
          return (b.cantidad || 0) * (b.valor || 0) - (a.cantidad || 0) * (a.valor || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchName, stockFilter, sortBy]);

  return (
    <section className="space-y-6">
      {/* Encabezado principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Control Manual de Existencias
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Inventario de Productos</h1>
          <p className="mt-1 text-slate-600">
            Carga, modifica, consulta y vacía existencias de tus productos organizados por nombre.
          </p>
        </div>

        {/* Acciones CRUD destacadas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón 1: Cargar existencias a un producto */}
          <button
            onClick={() => openLoadStockModal()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            title="Cargar o sumar existencias a un producto existente"
          >
            <span>📥 Cargar existencias</span>
          </button>

          {/* Botón 2: Carga masiva rápida */}
          <button
            onClick={openBatchModal}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-900"
            title="Editar las existencias de todos los productos en una sola vista"
          >
            <span>📋 Carga masiva</span>
          </button>

          {/* Botón 3: Crear nuevo producto en inventario */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <span>＋ Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* Alertas del sistema */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="font-bold text-red-600 hover:text-red-800">✕</button>
        </div>
      )}
      {successMsg && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          ✓ {successMsg}
        </div>
      )}

      {/* Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Productos Únicos</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalProducts}</p>
          <p className="mt-1 text-xs text-slate-500">Registrados en catálogo</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unidades en Existencia</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">{stats.totalUnits}</p>
          <p className="mt-1 text-xs text-slate-500">Total en almacén</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valor Total en Stock</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            ${stats.totalValue.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Valoración comercial</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alertas de Stock</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{stats.lowStock}</span>
            <span className="text-xs text-slate-500">bajos</span>
            <span className="text-2xl font-black text-rose-600 ml-2">{stats.outOfStock}</span>
            <span className="text-xs text-slate-500">agotados</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Por reabastecer</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CARGAR MANUALMENTE EXISTENCIAS A UN PRODUCTO   */}
      {/* ======================================================== */}
      {modalMode === "load_stock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">📥 Cargar Existencias Manualmente</h2>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockLoadSubmit} className="mt-4 space-y-4">
              {/* Selección del producto */}
              <label className="block text-sm font-medium text-slate-700">
                Seleccionar Producto *
                <select
                  required
                  value={stockLoadForm.productId}
                  onChange={(e) => setStockLoadForm({ ...stockLoadForm, productId: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="" disabled>-- Selecciona un producto --</option>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.producto} (Stock actual: {p.cantidad || 0} uds.)
                    </option>
                  ))}
                </select>
              </label>

              {/* Modo de Carga */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStockLoadForm({ ...stockLoadForm, mode: "add" })}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    stockLoadForm.mode === "add"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-sm">➕ Sumar al stock actual</span>
                  <span className="text-[11px] opacity-75">Entrada de mercancía nueva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockLoadForm({ ...stockLoadForm, mode: "set" })}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    stockLoadForm.mode === "set"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-sm">🎯 Fijar stock exacto</span>
                  <span className="text-[11px] opacity-75">Ajuste por conteo físico</span>
                </button>
              </div>

              {/* Cantidad */}
              <label className="block text-sm font-medium text-slate-700">
                {stockLoadForm.mode === "add" ? "Cantidad a ingresar (+ unidades) *" : "Nueva cantidad total en stock *"}
                <input
                  type="number"
                  min="0"
                  required
                  value={stockLoadForm.cantidad}
                  onChange={(e) => setStockLoadForm({ ...stockLoadForm, cantidad: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </label>

              {/* Atajos de cantidad rápida */}
              {stockLoadForm.mode === "add" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Accesos rápidos:</span>
                  {[5, 10, 20, 50, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStockLoadForm({ ...stockLoadForm, cantidad: n })}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              )}

              {/* Motivo o referencia */}
              <label className="block text-sm font-medium text-slate-700">
                Motivo / Referencia de carga
                <input
                  type="text"
                  value={stockLoadForm.motivo}
                  onChange={(e) => setStockLoadForm({ ...stockLoadForm, motivo: e.target.value })}
                  placeholder="Ej. Factura #402, Compra a proveedor, Ajuste mensual..."
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </label>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? "Guardando…" : "Confirmar carga de existencias"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CARGA MASIVA DE EXISTENCIAS (BATCH DRAFT)       */}
      {/* ======================================================== */}
      {modalMode === "batch_stock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">📋 Carga Masiva de Existencias</h2>
                <p className="text-xs text-slate-500">
                  Modifica las existencias de todos tus productos y guárdalas juntas con un solo clic.
                </p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="flex flex-1 flex-col overflow-hidden pt-4">
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate font-semibold text-slate-800">{item.producto}</p>
                      <p className="text-xs text-slate-500">
                        Precio: ${item.valor != null ? Number(item.valor).toLocaleString("es-CO") : "0"} | Stock actual: {item.cantidad ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`batch-qty-${item.id}`} className="text-xs font-medium text-slate-500">
                        Nuevo stock:
                      </label>
                      <input
                        id={`batch-qty-${item.id}`}
                        type="number"
                        min="0"
                        value={batchDraft[item.id] ?? 0}
                        onChange={(e) =>
                          setBatchDraft({
                            ...batchDraft,
                            [item.id]: e.target.value,
                          })
                        }
                        className="w-24 rounded-lg border border-slate-300 p-2 text-center text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-black disabled:opacity-60"
                >
                  {busy ? "Guardando…" : "Guardar todas las existencias"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CREAR O EDITAR PRODUCTO COMPLETO               */}
      {/* ======================================================== */}
      {(modalMode === "create_product" || modalMode === "edit_product") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? `Editar "${editingProduct.producto}"` : "＋ Registrar Nuevo Producto en Inventario"}
              </h2>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Nombre del producto *
                  <input
                    required
                    maxLength={255}
                    value={productForm.producto}
                    onChange={(e) => setProductForm({ ...productForm, producto: e.target.value })}
                    placeholder="Ej. Memoria RAM DDR5 Kingston Fury 32GB"
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Existencias Iniciales *
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.cantidad}
                    onChange={(e) => setProductForm({ ...productForm, cantidad: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Precio Unitario ($)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.valor}
                    onChange={(e) => setProductForm({ ...productForm, valor: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Enlace del Proveedor
                  <input
                    type="url"
                    value={productForm.url}
                    onChange={(e) => setProductForm({ ...productForm, url: e.target.value })}
                    placeholder="https://proveedor.com/item"
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  URL de Imagen
                  <input
                    type="url"
                    value={productForm.imagen}
                    onChange={(e) => setProductForm({ ...productForm, imagen: e.target.value })}
                    placeholder="https://…/imagen.jpg"
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-3">
                  Descripción o Notas de Inventario
                  <textarea
                    rows="2"
                    value={productForm.descripcion}
                    onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                    placeholder="Ubicación en estantería, SKU, lote, observaciones..."
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {busy ? "Guardando…" : editingProduct ? "Guardar cambios" : "Crear producto en inventario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BARRA DE FILTROS Y BÚSQUEDA POR NOMBRE                   */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        {/* Campo de búsqueda principal */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Buscar por nombre de producto..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-16 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          {searchName && (
            <button
              onClick={() => setSearchName("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Borrar
            </button>
          )}
        </div>

        {/* Filtros de estado y ordenamiento */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-600"
          >
            <option value="all">Todas las existencias ({items.length})</option>
            <option value="in_stock">En stock (&gt;3 uds.)</option>
            <option value="low_stock">Bajo stock (1 a 3 uds.)</option>
            <option value="out_of_stock">Agotados (0 uds.)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-600"
          >
            <option value="name_asc">Nombre: A → Z</option>
            <option value="name_desc">Nombre: Z → A</option>
            <option value="qty_desc">Mayor existencia</option>
            <option value="qty_asc">Menor existencia</option>
            <option value="price_desc">Mayor precio</option>
            <option value="total_desc">Mayor valor acumulado</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABLA PRINCIPAL DE INVENTARIO CON CRUD INTEGRADO         */}
      {/* ======================================================== */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Cargando existencias del inventario...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {searchName ? (
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  No se encontraron productos con el nombre &quot;{searchName}&quot;
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Intenta con otro término o crea el producto con ese nombre.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => setSearchName("")}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Limpiar búsqueda
                  </button>
                  <button
                    onClick={() => {
                      setProductForm({ ...emptyProductForm, producto: searchName });
                      setEditingProduct(null);
                      setModalMode("create_product");
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    ＋ Crear &quot;{searchName}&quot;
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-slate-700">No hay productos en el inventario.</p>
                <p className="mt-1 text-sm text-slate-500">
                  Haz clic en &quot;＋ Nuevo producto&quot; para cargar tu primera existencia.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Producto (Nombre)</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Existencias (Stock)</th>
                  <th scope="col" className="px-4 py-3.5">Estado</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Precio Unitario</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Valor Total</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Carga Rápida</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const hasLink = Boolean(sanitizeUrl(item.url));
                  const hasImage = Boolean(sanitizeUrl(item.imagen));
                  const qty = Number(item.cantidad) || 0;
                  const price = Number(item.valor) || 0;
                  const total = qty * price;
                  const isInlineEditing = inlineEditingId === item.id;

                  // Estado visual
                  let badge = (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      En stock ({qty} uds.)
                    </span>
                  );
                  if (qty === 0) {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        Agotado
                      </span>
                    );
                  } else if (qty <= 3) {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Bajo stock ({qty} uds.)
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                      {/* Imagen y Nombre del Producto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => hasLink && openProductLink(item.url)}
                            className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center ${
                              hasLink ? "cursor-pointer transition hover:opacity-80" : ""
                            }`}
                            title={hasLink ? "Clic para visitar al proveedor" : ""}
                          >
                            {hasImage ? (
                              <img
                                src={sanitizeUrl(item.imagen)}
                                alt={item.producto}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xl" aria-hidden="true">🛍️</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.producto}</p>
                            {item.descripcion && (
                              <p className="line-clamp-1 max-w-xs text-xs text-slate-500">
                                {item.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Control y Edición Inline de Existencias */}
                      <td className="px-4 py-3 text-center">
                        {isInlineEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={inlineStockValue}
                              onChange={(e) => setInlineStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInlineStock(item);
                                else if (e.key === "Escape") setInlineEditingId(null);
                              }}
                              className="w-16 rounded-lg border-2 border-indigo-600 p-1 text-center font-bold text-slate-900 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveInlineStock(item)}
                              title="Guardar existencia"
                              className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingId(null)}
                              title="Cancelar"
                              className="rounded-md bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => adjustStock(item, -1)}
                              disabled={qty <= 0}
                              title="Restar 1 unidad"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30"
                            >
                              -
                            </button>
                            {/* Clic para editar inline */}
                            <button
                              type="button"
                              onClick={() => {
                                setInlineEditingId(item.id);
                                setInlineStockValue(String(qty));
                              }}
                              title="Haz clic para escribir la existencia exacta"
                              className="min-w-10 rounded-lg px-2 py-1 text-center font-bold text-slate-900 transition hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              {qty}
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustStock(item, 1)}
                              title="Sumar 1 unidad"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">{badge}</td>

                      {/* Precio Unitario */}
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {price > 0 ? `$${price.toLocaleString("es-CO")}` : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Valor Total Acumulado */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {total > 0 ? `$${total.toLocaleString("es-CO")}` : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Atajos Rápidos de Carga (+5, +10) */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStock(item, 5)}
                            title="Añadir 5 unidades de inmediato"
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(item, 10)}
                            title="Añadir 10 unidades de inmediato"
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => openLoadStockModal(item)}
                            title="Abrir formulario para cargar existencia personalizada"
                            className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            📥 Cargar
                          </button>
                        </div>
                      </td>

                      {/* Acciones CRUD */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Editar producto completo */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Editar nombre, precio, enlace o notas"
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            Editar
                          </button>

                          {/* Botón Vaciar existencias (Poner en 0) */}
                          {qty > 0 && (
                            <button
                              type="button"
                              onClick={() => resetStockToZero(item)}
                              title="Poner existencias en 0 (marcar como agotado sin borrar el producto)"
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                            >
                              Vaciar (0)
                            </button>
                          )}

                          {/* Botón Eliminar producto de la base de datos */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(item)}
                            title="Eliminar este producto de la base de datos"
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
