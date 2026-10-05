import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookingApi";
import { BackTab } from "../components/SideTabs";
import { photoFor } from "../utils/vehiclePhotos";
import "./MyBooking.css";

/* Fields from your "Your details" popup, in the order they are shown.
   Each line: [id, label, names the field may have in the data] */
const KNOWN = [
  ["fullName", "Full name", ["fullName", "full_name", "name"]],
  ["phone", "Mobile", ["phone", "mobile"]],
  ["email", "Email", ["email"]],
  ["licence", "Licence", ["licence", "license", "licenseNumber"]],
  ["location", "Pick-up", ["location", "pickupLocation", "pickup_location"]],
  ["notes", "Notes", ["notes", "note"]],
];
const KNOWN_KEYS = new Set(KNOWN.flatMap(([, , keys]) => keys));

/* Fields shown in the main part of the card, so they are not repeated as details */
const HIDE = new Set([
  "id", "_id", "vehicleId", "vehicle_id", "vehicleName", "vehicle_name", "vehicle",
  "startDate", "start_date", "endDate", "end_date", "totalPrice", "total_price",
  "userId", "user_id", "createdAt", "created_at", "status",
]);

const label = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

/* first non-empty value among the given names, from the booking or its "details" object */
const pick = (b, keys) => {
  for (const src of [b, b.details, b.detail]) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) if (src[k] != null && src[k] !== "") return String(src[k]);
  }
  return "";
};

/* The popup details first, then anything else the booking carries */
function detailsOf(b) {
  const main = KNOWN
    .map(([id, name, keys]) => ({ id, label: name, value: pick(b, keys) }))
    .filter((d) => d.value);

  const rest = [];
  const add = (obj) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (HIDE.has(k) || KNOWN_KEYS.has(k) || v == null || v === "") return;
      if (Array.isArray(v)) rest.push({ id: k, label: label(k), value: v.join(", ") });
      else if (typeof v === "object") add(v);
      else rest.push({ id: k, label: label(k), value: String(v) });
    });
  };
  add(b);
  return [...main, ...rest];
}

const fmtDate = (s) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const daysBetween = (a, b) => {
  const n = Math.ceil((new Date(b) - new Date(a)) / 86400000);
  return Number.isNaN(n) ? 0 : Math.max(0, n) + 1;
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    getMyBookings()
      .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load your bookings. Please refresh."))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setError("");
    try {
      await cancelBooking(id);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not cancel the booking. Please try again.");
    }
  };

  return (
    <>
      <div className="mb-bg" aria-hidden="true" />
      <BackTab />

      <section className="mb-page">
        <header className="mb-head">
          <span className="mb-eyebrow">Your trips</span>
          <h2>My bookings</h2>
          <p className="mb-sub">
            {loading
              ? "Loading your bookings..."
              : `${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"}`}
          </p>
        </header>

        {error && <p className="mb-error">{error}</p>}

        {loading ? (
          <div className="mb-list">
            {[0, 1].map((i) => <div key={i} className="mb-skel" />)}
          </div>
        ) : bookings.length === 0 && !error ? (
          <div className="mb-empty">
            <div className="mb-empty-ring" aria-hidden="true" />
            <p>No bookings yet.</p>
            <Link to="/vehicles" className="mb-btn">Find a vehicle</Link>
          </div>
        ) : (
          <ul className="mb-list">
            {bookings.map((b, i) => {
              const name = b.vehicleName ?? b.vehicle_name ?? b.vehicle?.name ?? "Vehicle";
              const start = b.startDate ?? b.start_date;
              const end = b.endDate ?? b.end_date;
              const total = b.totalPrice ?? b.total_price;
              const photo = photoFor(name);
              const days = start && end ? daysBetween(start, end) : 0;
              const more = detailsOf(b);

              return (
                <li key={b.id ?? b._id} className="mb-card" style={{ "--i": i }}>
                  <div className="mb-photo">
                    {photo ? <img src={photo} alt={name} loading="lazy" /> : <span>{name.charAt(0)}</span>}
                  </div>

                  <div className="mb-main">
                    <div className="mb-top">
                      <h3>{name}</h3>
                      {b.status && <span className="mb-status">{b.status}</span>}
                    </div>
                    <p className="mb-dates">
                      {fmtDate(start)} <span aria-hidden="true">→</span> {fmtDate(end)}
                      {days > 0 && <em>{days} day{days > 1 ? "s" : ""}</em>}
                    </p>

                    {more.length > 0 && (
                      <dl className="mb-details">
                        {more.map((d) => (
                          <div key={d.id} className={d.id === "location" || d.id === "notes" ? "wide" : ""}>
                            <dt>{d.label}</dt>
                            <dd>{d.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>

                  <div className="mb-side">
                    <div className="mb-total">
                      <span>Total</span>
                      <strong>₹{total}</strong>
                    </div>
                    <button type="button" className="mb-cancel" onClick={() => handleCancel(b.id ?? b._id)}>
                      Cancel booking
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}