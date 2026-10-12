import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

const emptyForm = { nombre: "", telefono: "", email: "" };

export default function Agenda() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const { data } = await API.get("/agenda/");
      setContacts(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo cargar la agenda.");
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingId) await API.put(`/agenda/${editingId}`, form);
      else await API.post("/agenda/", form);
      setForm(emptyForm);
      setEditingId(null);
      await loadContacts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo guardar el contacto.");
    } finally {
      setBusy(false);
    }
  };

  const edit = (contact) => {
    setEditingId(contact.id);
    setForm({ nombre: contact.nombre || "", telefono: contact.telefono || "", email: contact.email || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    try {
      await API.delete(`/agenda/${id}`);
      await loadContacts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "No se pudo eliminar el contacto.");
    }
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Contactos</p>
        <h1 className="mt-1 text-3xl font-bold">Agenda</h1>
        <p className="mt-2 text-slate-600">Crea, consulta, actualiza y elimina contactos.</p>
      </div>

      <form onSubmit={submit} className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{editingId ? "Editar contacto" : "Agregar contacto"}</h2>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium">Nombre<input required maxLength={100} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
          <label className="text-sm font-medium">Teléfono<input maxLength={20} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
          <label className="text-sm font-medium">Correo electrónico<input type="email" maxLength={100} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label>
        </div>
        <div className="mt-4 flex gap-3">
          <button disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar contacto"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Cancelar</button>}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-5 py-4 font-semibold">Contactos guardados <span className="ml-1 text-slate-400">{contacts.length}</span></div>
        {contacts.length === 0 ? <p className="p-8 text-center text-slate-500">Aún no hay contactos en la agenda.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-medium">Nombre</th><th className="px-5 py-3 font-medium">Teléfono</th><th className="px-5 py-3 font-medium">Correo</th><th className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{contacts.map((contact) => <tr key={contact.id}>
                <td className="px-5 py-4 font-medium">{contact.nombre}</td><td className="px-5 py-4 text-slate-600">{contact.telefono || "—"}</td><td className="px-5 py-4 text-slate-600">{contact.email || "—"}</td>
                <td className="px-5 py-4 text-right whitespace-nowrap"><button onClick={() => edit(contact)} className="mr-3 font-medium text-indigo-700 hover:underline">Editar</button><button onClick={() => remove(contact.id)} className="font-medium text-red-600 hover:underline">Eliminar</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
