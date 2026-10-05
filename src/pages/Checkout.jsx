import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import Summary from "../components/Summary.jsx";

const PICKUP = ["Recess (9:30 AM)", "Lunch (12:00 PM)", "After class (3:30 PM)"];

export default function Checkout() {
  const { cart, placeOrder } = useStore();
  const nav = useNavigate();
  const [pickup, setPickup] = useState(PICKUP[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (cart.length === 0) return <Navigate to="/menu" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await placeOrder(pickup);
    setBusy(false);
    if (result.ok) nav("/tickets");
    else setError(result.error);
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Checkout</h1>
      <form onSubmit={submit} className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
            <legend className="px-1 font-display text-xl font-extrabold">When will you claim it?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {PICKUP.map((p) => (
                <label
                  key={p}
                  className={"cursor-pointer rounded-xl border-2 p-3 text-center font-medium " + (pickup === p ? "border-navy bg-navy text-white" : "border-ink/15")}
                >
                  <input type="radio" name="pickup" checked={pickup === p} onChange={() => setPickup(p)} className="sr-only" />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>

          <section className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-xl bg-gold/30 text-3xl" aria-hidden="true">💵</div>
            <div>
              <h2 className="font-display text-xl font-extrabold">Pay cash at the counter</h2>
              <p className="text-ink/70">Show your ticket, pay, and claim your order. No online payment needed.</p>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <Summary />
          {error && <p role="alert" className="font-bold text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-orange px-4 py-3 font-bold text-white hover:brightness-110 disabled:opacity-60">
            {busy ? "Placing order..." : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
