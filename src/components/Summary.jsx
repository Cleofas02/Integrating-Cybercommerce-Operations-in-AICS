import { useStore } from "../store.jsx";

// Live price breakdown, used on the Cart and Checkout pages.
export default function Summary() {
  const { total, cartCount } = useStore();
  const row = "flex justify-between py-1.5";
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 font-display text-xl font-extrabold">Order summary</h2>
      <div className={row}><span>Items ({cartCount})</span><span>₱{total.toFixed(2)}</span></div>
      <div className="mt-3 flex items-end justify-between rounded-xl bg-navy p-4 text-white">
        <span>Total to pay</span>
        <span className="font-display text-3xl font-extrabold">₱{total.toFixed(2)}</span>
      </div>
      <p className="mt-3 text-sm text-ink/70">Pay cash at the counter when you claim your order.</p>
    </div>
  );
}
