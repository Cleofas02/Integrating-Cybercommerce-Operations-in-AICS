import { useState } from "react";
import { CATEGORIES } from "../data.js";
import { useMenu } from "../useMenu.js";
import { useStore } from "../store.jsx";

export default function Catalog() {
  const { addToCart, cart } = useStore();
  const { items, loading, error, reload } = useMenu();
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);

  return (
    <div>
      <section className="rounded-2xl bg-navy p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">What are you eating today?</h1>
        <p className="mt-1 text-white/80">Order here, then pay cash and claim it at the counter.</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={"rounded-full border px-4 py-1.5 " + (cat === c ? "border-navy bg-navy text-white" : "border-ink/20 bg-white")}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-ink/60">Loading the menu...</p>}

      {error && (
        <div role="alert" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="font-medium text-red-600">{error}</p>
          <button onClick={reload} className="mt-3 rounded-full bg-navy px-5 py-2 font-bold text-white">Try again</button>
        </div>
      )}

      {!loading && !error && shown.length === 0 && (
        <p className="mt-8 rounded-2xl bg-white p-6 text-ink/70 shadow-sm">Nothing available here right now. Check back soon.</p>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => {
          const qty = cart.find((c) => c.id === item.id)?.qty;
          return (
            <li key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="relative flex h-36 items-center justify-center rounded-xl bg-paper text-6xl">
                <span aria-hidden="true">{item.emoji}</span>
                <span className="absolute left-2 top-2 rounded-md bg-navy px-2 py-1 text-xs text-white">{item.category}</span>
              </div>
              <div className="flex items-end justify-between px-1 pt-3">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="font-display text-xl font-extrabold text-navy">₱{item.price}</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="rounded-full bg-orange px-4 py-2 font-bold text-white hover:brightness-110"
                >
                  {qty ? `Add more (${qty})` : "Add to cart"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
