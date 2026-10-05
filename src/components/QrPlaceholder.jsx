// Fake QR look-alike. Replace with the `qrcode.react` package once the backend is ready.
export default function QrPlaceholder({ value }) {
  const cells = Array.from({ length: 81 }, (_, i) => (value.charCodeAt(i % value.length) * (i + 7)) % 3 !== 0);
  return (
    <div className="grid size-28 grid-cols-9 gap-px bg-white p-1" aria-label={"QR code for " + value}>
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-ink" : "bg-white"} />
      ))}
    </div>
  );
}
