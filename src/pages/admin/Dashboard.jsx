import { useCallback, useEffect, useState } from "react";
import MenuManager from "./MenuManager.jsx";
import { useStore } from "../../store.jsx";

const TABS = ["Overview", "Orders", "Menu items", "Verify ticket"];
const BADGE = { Preparing: "bg-gold text-ink", Ready: "bg-ok text-white", Claimed: "bg-ink/50 text-white" };

function SalesChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.total)); // at least 1, so a week with no sales doesn't divide by zero
  const pts = data.map((d, i) => [(i / (data.length - 1)) * 300, 100 - (d.total / max) * 85]);
  return (
    <div>
      <svg viewBox="0 -5 300 115" className="w-full" role="img" aria-label="Sales over the last 7 days">
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#14346b" strokeWidth="3" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#f28c28" />)}
      </svg>
      <div className="flex justify-between text-sm text-ink/60">
        {data.map((d, i) => <span key={i}>{d.day}</span>)}
      </div>
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
  const active = orders.filter((o) => o.status !== "Claimed");
  const claimed = orders.filter((o) => o.status === "Claimed");
  const list = view === "Active" ? active : claimed;

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
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"whitespace-nowrap rounded-xl px-4 py-3 text-left font-medium " + (tab === t ? "bg-navy text-white" : "bg-white hover:bg-white/60")}
          >
            {t}
          </button>
        ))}
      </nav>

      <div>
        <h1 className="font-display text-3xl font-extrabold">{greeting}, {user?.name}</h1>
        <p className="text-ink/60">Here's how the canteen is doing today.</p>
        {loadError && <p role="alert" className="mt-2 font-bold text-red-600">{loadError}</p>}

        {tab === "Overview" && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={card}><p className="text-ink/60">Sales today</p><p className="font-display text-3xl font-extrabold">₱{stats.salesToday.toFixed(2)}</p></div>
              <div className={card}><p className="text-ink/60">Orders today</p><p className="font-display text-3xl font-extrabold">{stats.ordersToday}</p></div>
              <div className={card}><p className="text-ink/60">Claimed today</p><p className="font-display text-3xl font-extrabold text-ok">{stats.claimedToday}</p></div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className={card}>
                <h2 className="mb-3 font-display text-xl font-extrabold">Sales, last 7 days</h2>
                {week.length > 1 && <SalesChart data={week} />}
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-navy p-5 text-white">
                <h2 className="font-display text-xl font-extrabold">Still to serve</h2>
                <p className="font-display text-6xl font-extrabold text-gold">{active.length}</p>
                <p className="text-white/70">orders waiting at the counter</p>
              </div>
            </div>
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
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full">
                <thead className="border-b border-ink/10"><tr><th className={th}>Order</th><th className={th}>Buyer</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}></th></tr></thead>
                <tbody className="divide-y divide-ink/10">
                  {list.length === 0 && (
                    <tr><td colSpan="5" className={td + " text-center text-ink/60"}>
                      {view === "Active" ? "No active orders right now." : "No claimed orders to show."}
                    </td></tr>
                  )}
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td className={td + " font-bold"}>{o.id}</td>
                      <td className={td}>{o.buyer}</td>
                      <td className={td}>₱{o.total.toFixed(2)}</td>
                      <td className={td}><span className={"rounded-full px-3 py-1 text-sm " + BADGE[o.status]}>{o.status}</span></td>
                      <td className={td + " text-right"}>
                        {o.status === "Preparing" && (
                          <button onClick={() => send("PUT", { code: o.id, status: "Ready" })} className="rounded-full bg-navy px-4 py-1.5 text-sm font-bold text-white">Mark ready</button>
                        )}
                        {o.status === "Ready" && (
                          <button onClick={() => setTab("Verify ticket")} className="rounded-full bg-orange px-4 py-1.5 text-sm font-bold text-white">Verify &amp; claim</button>
                        )}
                        {o.status === "Claimed" && (
                          <button onClick={() => remove(o.id)} className="text-orange underline">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
