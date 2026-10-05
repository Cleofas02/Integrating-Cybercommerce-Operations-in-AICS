import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";

const BADGE = {
  Preparing: "bg-gold text-ink",
  Ready: "bg-ok text-white",
  Claimed: "bg-ink/50 text-white",
};

export default function Tickets() {
  const { orders, loadOrders } = useStore();

  // Refresh when this page opens, so the status badges (Preparing / Ready / Claimed) are current.
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-5xl" aria-hidden="true">🎟️</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">No tickets yet</h1>
        <p className="mt-1 text-ink/70">Your tickets show up here after you place an order.</p>
        <Link to="/menu" className="mt-4 inline-block rounded-full bg-orange px-5 py-2 font-bold text-white">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">My tickets</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {orders.map((o) => (
          <article key={o.id} className="ticket bg-white">
            <header className="flex items-start justify-between bg-navy p-5 text-white">
              <div>
                <p className="text-sm text-white/70">Ticket code</p>
                <p className="font-display text-3xl font-extrabold tracking-wide">{o.id}</p>
                <p className="text-sm">Claim at: {o.pickup}</p>
              </div>
              <span className={"rounded-full px-3 py-1 text-sm font-medium " + BADGE[o.status]}>{o.status}</span>
            </header>
            <ul className="space-y-1 p-5 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.qty} × {i.name}</span>
                  <span>₱{i.price * i.qty}</span>
                </li>
              ))}
            </ul>
            <footer className="mx-5 border-t-2 border-dashed border-ink/20 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-ink/60">Pay cash at the counter</p>
                  <p className="font-display text-3xl font-extrabold text-navy">₱{o.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink/60">Reference no.</p>
                  <p className="rounded-lg bg-paper px-3 py-1 font-mono text-2xl font-bold tracking-widest">{o.ref}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink/70">
                At the counter, tell the staff your ticket code and reference number.
              </p>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
