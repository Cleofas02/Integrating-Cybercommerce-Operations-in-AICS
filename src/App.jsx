import { Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Catalog from "./pages/Catalog.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Tickets from "./pages/Tickets.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";

function RequireRole({ role, children }) {
  const { user, loading } = useStore();
  if (loading) return <p className="p-8">Loading...</p>; // wait for /api/me before deciding
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/menu"} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/menu" element={<RequireRole role="student"><Catalog /></RequireRole>} />
        <Route path="/cart" element={<RequireRole role="student"><Cart /></RequireRole>} />
        <Route path="/checkout" element={<RequireRole role="student"><Checkout /></RequireRole>} />
        <Route path="/tickets" element={<RequireRole role="student"><Tickets /></RequireRole>} />
        <Route path="/admin" element={<RequireRole role="admin"><Dashboard /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
