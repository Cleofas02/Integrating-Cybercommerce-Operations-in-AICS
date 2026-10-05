import { useState } from "react";
import { CATEGORIES } from "../../data.js";
import { useMenu } from "../../useMenu.js";

const CATS = CATEGORIES.filter((c) => c !== "All");
const BLANK = { name: "", category: "Meals", price: "", emoji: "🍽️", is_available: true };

export default function MenuManager() {
  const { items, loading, error, reload } = useMenu();
  const [form, setForm] = useState(null); // null = closed; otherwise the item being added or edited
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm({ ...form, [key]: value });

  // One helper for add (POST), edit (PUT) and remove (DELETE)
  async function call(method, body) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin-menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Something went wrong.");
        return false;
      }
      await reload();
      return true;
    } catch {
      setMsg("Can't reach the server. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (await call(form.id ? "PUT" : "POST", form)) setForm(null);
  }

  async function remove(item) {
    if (window.confirm(`Remove "${item.name}" from the menu? Past orders keep their record of it.`)) {
      await call("DELETE", { id: item.id });
    }
  }

  const th = "px-4 py-3 text-left font-bold";
  const td = "px-4 py-3";
  const field = "w-full rounded-xl border border-ink/15 bg-white px-4 py-3";

  return (
    <div>
      {!form && (
        <button onClick={() => { setMsg(""); setForm(BLANK); }} className="mb-4 rounded-full bg-orange px-5 py-2 font-bold text-white">
          Add item
        </button>
      )}

      {form && (
        <form onSubmit={save} className="mb-4 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[80px_1fr_1fr_130px]">
          <h2 className="font-display text-xl font-extrabold sm:col-span-4">{form.id ? "Edit item" : "Add a new item"}</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Emoji</span>
            <input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={8} className={field + " text-center text-2xl"} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Category</span>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={field}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Price (₱)</span>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required className={field} />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={form.is_available} onChange={(e) => set("is_available", e.target.checked)} />
            Available to order (untick to hide it from students)
          </label>
          <div className="flex gap-2 sm:col-span-2 sm:justify-end">
            <button type="button" onClick={() => setForm(null)} className="rounded-full border border-ink/20 px-5 py-2">Cancel</button>
            <button disabled={busy} className="rounded-full bg-navy px-5 py-2 font-bold text-white disabled:opacity-60">
              {busy ? "Saving..." : "Save item"}
            </button>
          </div>
        </form>
      )}

      {(msg || error) && <p role="alert" className="mb-4 font-medium text-red-600">{msg || error}</p>}
      {loading && <p className="text-ink/60">Loading the menu...</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-ink/10">
            <tr><th className={th}>Item</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Status</th><th className={th}></th></tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {!loading && items.length === 0 && (
              <tr><td colSpan="5" className={td + " text-center text-ink/60"}>No items yet. Add your first one.</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.id}>
                <td className={td + " font-bold"}><span aria-hidden="true">{i.emoji}</span> {i.name}</td>
                <td className={td}>{i.category}</td>
                <td className={td}>₱{i.price}</td>
                <td className={td}>
                  <span className={"rounded-full px-3 py-1 text-sm " + (i.is_available ? "bg-ok text-white" : "bg-ink/50 text-white")}>
                    {i.is_available ? "Available" : "Hidden"}
                  </span>
                </td>
                <td className={td + " space-x-3 text-right"}>
                  <button onClick={() => { setMsg(""); setForm({ ...i }); }} className="text-navy underline">Edit</button>
                  <button onClick={() => remove(i)} className="text-orange underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
