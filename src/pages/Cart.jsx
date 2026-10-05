import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import Summary from "../components/Summary.jsx";

export default function Cart() {
  const { cart, setQty } = useStore();

  if (cart.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-5xl" aria-hidden="true">🛒</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Your cart is empty</h1>
        <p className="mt-1 text-ink/70">Add something from the menu to get started.</p>
        <Link to="/menu" className="mt-4 inline-block rounded-full bg-orange px-5 py-2 font-bold text-white">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Your cart</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {cart.map((i) => (
            <li key={i.id} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex size-16 items-center justify-center rounded-xl bg-paper text-3xl" aria-hidden="true">{i.emoji}</div>
              <div className="mr-auto">
                <p className="font-bold">{i.name}</p>
                <p className="text-sm text-ink/60">₱{i.price} each</p>
                <button onClick={() => setQty(i.id, 0)} className="mt-1 text-sm text-orange underline">Remove</button>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-ink/15 p-1">
                <button aria-label={"Remove one " + i.name} onClick={() => setQty(i.id, i.qty - 1)} className="size-8 rounded-full hover:bg-paper">−</button>
                <span className="w-6 text-center font-bold">{i.qty}</span>
                <button aria-label={"Add one " + i.name} onClick={() => setQty(i.id, i.qty + 1)} className="size-8 rounded-full hover:bg-paper">+</button>
              </div>
              <span className="w-20 text-right font-display text-lg font-extrabold">₱{i.price * i.qty}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <Summary />
          <Link to="/checkout" className="block rounded-xl bg-orange px-4 py-3 text-center font-bold text-white hover:brightness-110">
            Go to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
