import { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, role: "student" | "admin" }
  const [loading, setLoading] = useState(true); // true until we know if someone is logged in
  const [cart, setCart] = useState([]); // [{ id, name, price, qty }]
  const [orders, setOrders] = useState([]); // the student's own orders (tickets), loaded from the database

  // Load this student's tickets from the server.
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch {
      /* keep the old list if the network fails */
    }
  }, []);

  // When the app opens, ask the server who is logged in (reads the cookie).
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Whenever a student is logged in, load their tickets. Nobody else has any.
  useEffect(() => {
    if (user?.role === "student") loadOrders();
    else setOrders([]);
  }, [user, loadOrders]);

  const addToCart = (item) =>
    setCart((c) =>
      c.find((i) => i.id === item.id)
        ? c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...c, { ...item, qty: 1 }]
    );

  const setQty = (id, qty) =>
    setCart((c) =>
      qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i))
    );

  // No discount and no service fee, so the total is just the items.
  // This is only for showing the cart. The server calculates the real total itself.
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Sends the cart to the server. The server prices it, saves it, and makes the ticket code
  // and reference number. We only send item ids and quantities, never prices.
  const placeOrder = async (pickup) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup, items: cart.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Could not place the order." };
      setCart([]);
      await loadOrders();
      return { ok: true };
    } catch {
      return { ok: false, error: "Network problem. Please try again." };
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setCart([]);
  };

  return (
    <Ctx.Provider
      value={{ user, setUser, loading, logout, cart, addToCart, setQty, total, cartCount, orders, loadOrders, placeOrder }}
    >
      {children}
    </Ctx.Provider>
  );
}
