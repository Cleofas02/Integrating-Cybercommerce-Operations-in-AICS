// Put the school logo at public/logo.png and it appears here automatically.
export default function Brand({ light }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.png"
        alt=""
        className="size-9 rounded-full bg-white"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span className={"font-display text-xl font-extrabold " + (light ? "text-white" : "text-navy")}>
        AICS Canteen
      </span>
    </div>
  );
}
