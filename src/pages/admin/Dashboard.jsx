import { useCallback, useEffect, useState } from "react";
import MenuManager from "./MenuManager.jsx";
import { useStore } from "../../store.jsx";

const TABS = ["Overview", "Orders", "Menu items", "Verify ticket"];
const STRIPE = { Preparing: "border-gold", Ready: "border-ok", Claimed: "border-ink/25" };
const SLOTS = ["Recess (9:30 AM)", "Lunch (12:00 PM)", "After class (3:30 PM)"];
const BADGE = { Preparing: "bg-gold text-ink", Ready: "bg-ok text-white", Claimed: "bg-ink/50 text-white" };

function SalesChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.total)); // at least 1, so a week with no sales doesn't divide by zero
  const x = (i) => ((i + 0.5) / data.length) * 320; // lines up with the 7 day labels underneath
  const y = (v) => 118 - (v / max) * 100;
  const last = data.length - 1;
  const line = data.map((d, i) => `${x(i)},${y(d.total)}`).join(" ");
  return (
    <div>
      <svg viewBox="0 0 320 130" className="w-full" role="img" aria-label="Cash collected over the last 7 days">
        {[18, 68, 118].map((g) => <line key={g} x1="0" x2="320" y1={g} y2={g} stroke="#16233b" strokeOpacity="0.08" />)}
        <polygon points={`${x(0)},118 ${line} ${x(last)},118`} fill="#14346b" fillOpacity="0.08" />
        <polyline points={line} fill="none" stroke="#f28c28" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last)} cy={y(data[last].total)} r="6" fill="#f28c28" stroke="#fff" strokeWidth="3" />
      </svg>
      <ul className="grid grid-cols-7 text-center text-sm">
        {data.map((d, i) => (
          <li key={i} className={i === last ? "font-bold text-navy" : "text-ink/60"}>
            <span className="block">{d.day}</span>
            <span className="block text-xs tabular-nums">₱{Math.round(d.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useStore();
  const [tab, setTab] = useState("Overview");
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ salesToday: 0, ordersToday: 0, claimedToday: 0 });
  const [week, setWeek] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("Active");
  const [code, setCode] = useState("");
  const [ref, setRef] = useState("");
  const [result, setResult] = useState(null);

  // Load orders + today's numbers from the database, and refresh every 15 seconds ("live" dashboard).
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data.orders);
      setStats(data.stats);
      setWeek(data.week);
      setLoadError("");
    } catch (e) {
      setLoadError(e.message || "Could not load orders.");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  // Send a change to the server, then reload the list.
  async function send(method, body) {
    try {
      const res = await fetch("/api/admin-orders", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) window.alert(data.error || "Something went wrong.");
    } catch {
      window.alert("Network problem. Please try again.");
    }
    await load();
  }

  // The server already leaves out removed orders, so everything here is on the list.
  // Kitchen order: orders still to PREPARE first, then ones already Ready; oldest first inside each group.
  // (The server sends newest first, so we reverse it, then sort by status. sort() keeps that order within a group.)
  const rank = (o) => (o.status === "Preparing" ? 0 : 1);
  const active = orders.filter((o) => o.status !== "Claimed").reverse().sort((a, b) => rank(a) - rank(b));
  const claimed = orders.filter((o) => o.status === "Claimed");
  const list = view === "Active" ? active : claimed;

  // Add up everything in the "Preparing" orders, e.g. 5 x Chicken Adobo Rice, 3 x Iced Tea.
  const toPrepare = Object.values(
    orders
      .filter((o) => o.status === "Preparing")
      .flatMap((o) => o.items)
      .reduce((acc, i) => {
        acc[i.name] = { ...i, qty: (acc[i.name]?.qty || 0) + i.qty };
        return acc;
      }, {})
  );

  const slots = SLOTS.map((full) => ({
    name: full.split(" (")[0],
    time: full.match(/\((.*)\)/)[1],
    preparing: orders.filter((o) => o.pickup === full && o.status === "Preparing").length,
    ready: orders.filter((o) => o.pickup === full && o.status === "Ready").length,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function remove(id) {
    if (window.confirm("Remove this order from the list? Your sales totals still count it.")) send("DELETE", { code: id });
  }

  // Two-step check, done on the server: the ticket code AND the reference number must belong to the same order.
  async function verify(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/verify-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reference: ref }),
      });
      const data = await res.json();
      if (!res.ok) return setResult({ ok: false, text: data.error || "Could not verify the ticket." });
      setResult({ ok: true, text: `Verified. ${data.code} is now claimed. Collect ₱${data.total.toFixed(2)} cash.` });
      setCode("");
      setRef("");
      load();
    } catch {
      setResult({ ok: false, text: "Network problem. Please try again." });
    }
  }

  const th = "px-4 py-3 text-left font-bold";
  const td = "px-4 py-3";
  const card = "rounded-2xl bg-white p-5 shadow-sm";
  const field = "w-full rounded-xl border border-ink/15 bg-white px-4 py-3";

  return (
    <div className="grid gap-6 md:grid-cols-[210px_1fr]">
      <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-navy p-2 md:sticky md:top-4 md:flex-col md:self-start md:p-3" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={"flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-left font-medium " + (tab === t ? "bg-orange text-white" : "text-white/80 hover:bg-white/10")}
          >
            {t}
            {t === "Orders" && active.length > 0 && <span className="rounded-full bg-white px-2 text-sm font-bold text-navy">{active.length}</span>}
          </button>
        ))}
      </nav>

      <div>
        <h1 className="font-display text-3xl font-extrabold">{greeting}, {user?.name}</h1>
        <p className="text-ink/60">Here's how the canteen is doing today.</p>
        {loadError && <p role="alert" className="mt-2 font-bold text-red-600">{loadError}</p>}

        {tab === "Overview" && (
          <div className="mt-6 space-y-5">
            <section className="rounded-3xl bg-navy-deep p-5 text-white md:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold">Counter board</h2>
                  <p className="text-white/65">{active.length} {active.length === 1 ? "order is" : "orders are"} waiting at the counter.</p>
                </div>
                <button onClick={() => setTab("Orders")} className="rounded-full bg-orange px-5 py-2 font-bold text-white hover:brightness-110">Open orders</button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {slots.map((s) => (
                  <div key={s.name} className="ticket rounded-2xl bg-paper p-5 text-ink">
                    <p className="font-display text-xl font-extrabold">{s.name}</p>
                    <p className="text-ink/60">{s.time}</p>
                    <div className="mt-5 flex gap-8">
                      <div><p className="font-display text-5xl font-extrabold leading-none tabular-nums">{s.preparing}</p><p className="mt-1 text-sm text-ink/60">to prepare</p></div>
                      <div><p className="font-display text-5xl font-extrabold leading-none tabular-nums text-ok">{s.ready}</p><p className="mt-1 text-sm text-ink/60">ready</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold">Cash collected today</h2>
                  <p className="font-display text-4xl font-extrabold text-navy tabular-nums">₱{stats.salesToday.toFixed(2)}</p>
                </div>
                <p className="text-ink/70">
                  <span className="font-bold text-ink">{stats.claimedToday}</span> of <span className="font-bold text-ink">{stats.ordersToday}</span> orders claimed today
                </p>
              </div>
              {week.length > 1 && <SalesChart data={week} />}
            </section>
          </div>
        )}

        {tab === "Orders" && (
          <div className="mt-6">
            <div className="mb-4 flex gap-2">
              {[["Active", active.length], ["Claimed", claimed.length]].map(([name, n]) => (
                <button
                  key={name}
                  onClick={() => setView(name)}
                  className={"rounded-full border px-4 py-1.5 " + (view === name ? "border-navy bg-navy text-white" : "border-ink/20 bg-white")}
                >
                  {name} ({n})
                </button>
              ))}
            </div>
            {view === "Active" && toPrepare.length > 0 && (
              <div className="mb-4 rounded-2xl bg-navy p-5 text-white">
                <h2 className="mb-2 font-display text-lg font-extrabold">To prepare now</h2>
                <ul className="flex flex-wrap gap-x-6 gap-y-1">
                  {toPrepare.map((i) => (
                    <li key={i.name}>{i.emoji} {i.name} <span className="font-bold text-gold">×{i.qty}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="space-y-3">
              {list.length === 0 && (
                <li className="rounded-2xl bg-white p-6 text-center text-ink/60 shadow-sm">
                  {view === "Active" ? "No active orders right now." : "No claimed orders to show."}
                </li>
              )}
              {list.map((o) => (
                <li key={o.id} className={"flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border-l-8 bg-white p-4 shadow-sm " + STRIPE[o.status]}>
                  <div className="min-w-28">
                    <p className="font-display text-xl font-extrabold">{o.id}</p>
                    <p className="text-sm text-ink/60">Claim: {o.pickup}</p>
                  </div>
                  <div className="min-w-48 flex-1">
                    <ul className="space-y-0.5 font-medium">
                      {o.items.map((i, k) => <li key={k}>{i.emoji} {i.name} <span className="font-bold text-orange">×{i.qty}</span></li>)}
                    </ul>
                    <p className="mt-1 text-sm text-ink/60">{o.buyer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold tabular-nums">₱{o.total.toFixed(2)}</p>
                    <span className={"rounded-full px-3 py-1 text-sm " + BADGE[o.status]}>{o.status}</span>
                  </div>
                  <div className="w-full text-right sm:w-auto">
                    {o.status === "Preparing" && (
                      <button onClick={() => send("PUT", { code: o.id, status: "Ready" })} className="rounded-full bg-navy px-5 py-2 font-bold text-white hover:bg-navy-deep">Mark ready</button>
                    )}
                    {o.status === "Ready" && (
                      <button onClick={() => setTab("Verify ticket")} className="rounded-full bg-orange px-5 py-2 font-bold text-white hover:brightness-110">Verify &amp; claim</button>
                    )}
                    {o.status === "Claimed" && (
                      <button onClick={() => remove(o.id)} className="text-orange underline">Remove</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "Menu items" && <div className="mt-6"><MenuManager /></div>}

        {tab === "Verify ticket" && (
          <form onSubmit={verify} className="mt-6 max-w-md space-y-4">
            <p className="text-ink/70">Ask the student for the two codes on their ticket. Both must match the same order.</p>
            <label className="block">
              <span className="mb-1 block font-bold">1. Ticket code</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ORD-1002" required className={field} />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold">2. Reference number</span>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="6 digits, e.g. 730164" inputMode="numeric" required className={field + " font-mono"} />
            </label>
            <button className="rounded-full bg-navy px-6 py-3 font-bold text-white hover:bg-navy-deep">Verify &amp; claim</button>
            {result && <p role="status" className={"font-bold " + (result.ok ? "text-ok" : "text-red-600")}>{result.text}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
