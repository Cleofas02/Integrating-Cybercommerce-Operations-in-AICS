import { useCallback, useEffect, useState } from "react";

// Loads the menu from the database. Call reload() after you change something.
export function useMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the menu.");
      setItems(data.items);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load the menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { items, loading, error, reload };
}
