import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getVehicle } from "../api/vehicleApi";
import { createBooking } from "../api/bookingApi";
import { useAuth } from "../context/AuthContext";
import { BackTab } from "../components/SideTabs";
import { photoFor, spinFor } from "../utils/vehiclePhotos";
import BikeSpin from "../components/BikeSpin";
import DetailForm from "../components/DetailForm";

import "./Vehicles.css";
import "./VehicleDetail.css";

/* A real database id is a 24-character hex string (MongoDB ObjectId).
   Mock vehicles use ids like "1", which the backend cannot book. */
const isDbId = (id) => /^[a-f\d]{24}$/i.test(String(id));

/* Dates passed in the link by the chat assistant: ?start=YYYY-MM-DD&end=YYYY-MM-DD */
const isoDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");

/* Common page shell */
function Shell({ children }) {
  return (
    <>
      <BackTab to="/vehicles" label="Back to models" />
      <div className="vd-page">
        <div className="vd-bg" aria-hidden="true" />
        {children}
      </div>
    </>
  );
}

/* Today's date as YYYY-MM-DD (local time) */
const todayStr = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

/* Turn FastAPI errors into readable text */
function errorText(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(". ");
  }

  if (!err?.response) return "Cannot reach the server. Check that the backend is running.";

  return fallback;
}

export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const autoOpened = useRef(false);

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState(() => {
    const s = params.get("start");
    const e = params.get("end");
    if (isoDay(s) && s >= todayStr()) {
      return { startDate: s, endDate: isoDay(e) && e >= s ? e : "" };
    }
    return { startDate: "", endDate: "" };
  });
  const [message, setMessage] = useState(""); // error shown in the booking panel
  const [formError, setFormError] = useState(""); // error shown inside the popup
  const [showForm, setShowForm] = useState(false);

  /* Get the vehicle */
  useEffect(() => {
    getVehicle(id)
      .then((data) => setVehicle(data))
      .catch(() => setVehicle(null))
      .finally(() => setLoading(false));
  }, [id]);

  /* Lock page scrolling */
  useEffect(() => {
    document.body.classList.add("vd-lock");
    return () => document.body.classList.remove("vd-lock");
  }, []);

  /* Sent here by the chat assistant (?book=1): open the details popup straight away */
  useEffect(() => {
    if (autoOpened.current || !vehicle || !user) return;
    if (params.get("book") !== "1") return;
    if (!dates.startDate || !dates.endDate || !vehicle.available || !isDbId(id)) return;
    autoOpened.current = true;
    setFormError("");
    setShowForm(true);
  }, [vehicle, user, dates, id, params]);

  if (loading) {
    return (
      <Shell>
        <p className="vd-msg">Loading...</p>
      </Shell>
    );
  }

  if (!vehicle) {
    return (
      <Shell>
        <p className="vd-msg">
          Vehicle not found. <Link to="/vehicles">Back to all vehicles</Link>
        </p>
      </Shell>
    );
  }

  /* Days (both the pick-up and return day count) and total */
  const days =
    dates.startDate && dates.endDate
      ? Math.max(
          0,
          Math.ceil((new Date(dates.endDate) - new Date(dates.startDate)) / 86400000)
        ) + 1
      : 0;
  const total = days * Number(vehicle.pricePerDay);

  const photo = vehicle.image || photoFor(vehicle.name);
  const spin = spinFor(vehicle.name);

  /* Pick-up date: clear the return date if it is now before pick-up */
  const handleStart = (value) => {
    setDates((current) => ({
      startDate: value,
      endDate: current.endDate && current.endDate < value ? "" : current.endDate,
    }));
    setMessage("");
  };

  /* Continue: log in first, check dates, then open the details popup */
  const handleBook = (e) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      navigate("/login", { state: { from: { pathname: `/vehicles/${id}` } } });
      return;
    }

    if (!dates.startDate || !dates.endDate) {
      setMessage("Please select both dates.");
      return;
    }

    if (!isDbId(id)) {
      setMessage("This vehicle isn't in the database yet, so it can't be booked.");
      return;
    }

    setFormError("");
    setShowForm(true);
  };

  /* Confirm booking (called by the popup) */
  const submitBooking = async (details) => {
    setFormError("");
    try {
      await createBooking({
        vehicleId: String(id),
        startDate: dates.startDate,
        endDate: dates.endDate,
        fullName: details.fullName?.trim() || null,
        phone: details.phone?.replace(/\s|-/g, "") || null,
        email: details.email?.trim() || null,
        licence: details.licence?.replace(/\s|-/g, "").toUpperCase() || null,
        location: details.location?.trim() || null,
        notes: details.notes?.trim() || null,
      });

      setShowForm(false);
      navigate("/my-bookings");
    } catch (err) {
      /* Keep the popup open and show the problem inside it */
      setFormError(errorText(err, "Booking failed. Please try again."));
    }
  };

  return (
    <Shell>
      <div className="vd-grid">
        {/* LEFT SIDE */}
        <section className="vd-left">
          <div className="vd-hero">
            {spin ? (
              <BikeSpin {...spin} />
            ) : photo ? (
              <img src={photo} alt={vehicle.name} />
            ) : (
              <div className="vd-ph">{vehicle.type}</div>
            )}

            <span className={vehicle.available ? "vd-status ok" : "vd-status off"}>
              {vehicle.available ? "Available" : "Booked"}
            </span>
          </div>

          <span className="vd-type">{vehicle.type}</span>
          <h2 className="vd-title">{vehicle.name}</h2>
          <p className="vd-price">
            ₹{vehicle.pricePerDay}
            <small>/day</small>
          </p>

          <div className="vd-specs">
            <div className="vd-spec">
              <span>Seats</span>
              <strong>{vehicle.seats}</strong>
            </div>
            <div className="vd-spec">
              <span>Fuel</span>
              <strong>{vehicle.fuel}</strong>
            </div>
            <div className="vd-spec">
              <span>Type</span>
              <strong>{vehicle.type}</strong>
            </div>
            <div className="vd-spec">
              <span>Rate</span>
              <strong>₹{vehicle.pricePerDay}/day</strong>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE: booking panel */}
        <aside className="vd-book">
          <h3>Book this vehicle</h3>
          <p className="vd-note">Choose your dates. You can cancel from My bookings.</p>

          <form onSubmit={handleBook}>
            {message && <p className="vd-error">{message}</p>}

            <label className="vd-field">
              Pick-up date
              <input
                type="date"
                required
                min={todayStr()}
                value={dates.startDate}
                onChange={(e) => handleStart(e.target.value)}
              />
            </label>

            <label className="vd-field">
              Return date
              <input
                type="date"
                required
                min={dates.startDate || todayStr()}
                value={dates.endDate}
                onChange={(e) => {
                  setDates({ ...dates, endDate: e.target.value });
                  setMessage("");
                }}
              />
            </label>

            {days > 0 ? (
              <div className="vd-sum">
                <div className="vd-row">
                  <span>
                    ₹{vehicle.pricePerDay} × {days} day{days > 1 ? "s" : ""}
                  </span>
                  <span>₹{total}</span>
                </div>
                <div className="vd-row vd-total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            ) : (
              <p className="vd-hint">Pick your dates to see the total.</p>
            )}

            <button type="submit" className="vd-btn" disabled={!vehicle.available}>
              {vehicle.available ? "Continue" : "Not available"}
            </button>

            {!user && vehicle.available && (
              <p className="vd-login">You'll be asked to log in first.</p>
            )}
          </form>
        </aside>
      </div>

      {/* Details popup */}
      {showForm && (
        <DetailForm
          vehicle={{ name: vehicle.name, price: vehicle.pricePerDay }}
          pickup={dates.startDate}
          dropoff={dates.endDate}
          total={total}
          error={formError}
          onClose={() => setShowForm(false)}
          onSubmit={submitBooking}
        />
      )}
    </Shell>
  );
}