import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import Brand from "../components/Brand.jsx";

const icon = { viewBox: "0 0 24 24", className: "size-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true };
const MailIcon = () => (<svg {...icon}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const LockIcon = () => (<svg {...icon}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
const UserIcon = () => (<svg {...icon}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>);

// Input with its label sitting on the border
function Field({ label, icon: Icon, ...props }) {
  return (
    <label className="relative block">
      <span className="absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-bold text-navy">{label}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/60"><Icon /></span>
      <input {...props} required className="w-full rounded-lg border-2 border-navy/25 bg-white py-3 pl-11 pr-3 focus:border-navy" />
    </label>
  );
}

// Decorative overlapping circles in the page corners
function Pattern({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={"pointer-events-none absolute size-56 text-white/10 " + className} fill="currentColor" aria-hidden="true">
      <circle cx="40" cy="40" r="34" /><circle cx="80" cy="40" r="34" />
      <circle cx="40" cy="80" r="34" /><circle cx="80" cy="80" r="34" />
    </svg>
  );
}

export default function Login() {
  const { setUser } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(mode === "login" ? "/api/login" : "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
      setUser(data.user);
      nav(data.user.role === "admin" ? "/admin" : "/menu");
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-deep p-4">
      <Pattern className="-left-16 -top-16" />
      <Pattern className="-bottom-16 -right-16" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
        {/* Left: school identity. Add public/campus.jpg to show a campus photo behind it. */}
        <section
          className="hidden flex-col items-center justify-center gap-4 bg-navy bg-cover bg-center p-10 text-center text-white md:flex"
          style={{ backgroundImage: "linear-gradient(rgb(12 34 80 / 0.82), rgb(12 34 80 / 0.82)), url(/campus.jpg)" }}
        >
          <img src="/logo.png" alt="AICS Commonwealth Branch official seal" className="size-48 rounded-3xl" />
          <h1 className="font-display text-3xl font-extrabold leading-tight">Asian Institute of Computer Studies</h1>
          <p className="text-lg text-white/80">Commonwealth Branch</p>
          <p className="mt-2 max-w-xs text-white/70">Order your canteen meal ahead, then skip the line.</p>
        </section>

        {/* Right: form */}
        <section className="px-6 py-10 sm:px-12">
          <div className="mb-6 flex justify-center md:hidden"><Brand /></div>
          <h2 className="text-center font-display text-5xl font-extrabold text-navy">
            {mode === "login" ? "Welcome" : "Join us"}
          </h2>
          <p className="mb-8 mt-1 text-center text-ink/60">
            {mode === "login" ? "Log in with your school email" : "Create your canteen account"}
          </p>

          <form onSubmit={submit} className="space-y-6">
            {mode === "register" && (
              <Field label="Full name" icon={UserIcon} name="name" value={form.name} onChange={change} />
            )}
            <Field label="School email" icon={MailIcon} name="email" type="email" value={form.email} onChange={change} />
            <Field label="Password" icon={LockIcon} name="password" type="password" value={form.password} onChange={change} />

            {error && <p role="alert" className="text-center font-medium text-red-600">{error}</p>}

            <button
              disabled={busy}
              className="mx-auto block rounded-lg bg-navy px-12 py-3 font-bold text-white shadow-md hover:bg-navy-deep disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink/70">
            {mode === "login" ? "Don't have an account? " : "Already registered? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-bold text-navy underline"
            >
              {mode === "login" ? "Register now" : "Log in"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
