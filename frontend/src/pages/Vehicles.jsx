import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVehicles } from "../api/vehicleApi";
import VehicleCard from "../components/VehicleCard";
import "../components/VehicleTab.css"; // gives the side tab its look
import "./Vehicles.css";

const TYPES = ["All", "Hatchback", "SUV", "MPV", "Bike"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Right-edge tab: cinematic fade back to the home page */
function HomeTab({ to = "/", label = "Back to home" }) {
  const navigate = useNavigate();

  const handleClick = async (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate(to);
      return;
    }

    const ov = document.createElement("div");
    ov.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#000;opacity:0;pointer-events:all";
    const line = document.createElement("div");
    line.style.cssText =
      "position:absolute;left:10%;right:10%;top:50%;height:2px;background:#ff2b2b;" +
      "box-shadow:0 0 14px rgba(255,43,43,.8);transform:scaleX(0);transform-origin:left";
    ov.appendChild(line);
    document.body.appendChild(ov);

    try {
      await ov.animate({ opacity: [0, 1] }, { duration: 420, easing: "ease-in-out", fill: "forwards" }).finished;
      await line.animate({ transform: ["scaleX(0)", "scaleX(1)"] }, { duration: 450, easing: "ease-in-out", fill: "forwards" }).finished;
      navigate(to);
      await wait(250);
      await ov.animate({ opacity: [1, 0] }, { duration: 520, easing: "ease-in-out", fill: "forwards" }).finished;
    } finally {
      ov.remove();
    }
  };

  return (
    <Link to={to} className="vt vt-right" aria-label={label} onClick={handleClick}>
      <svg className="vt-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 11l8-6.5L20 11v8a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="vt-text">{label}</span>
      <span className="vt-dot" aria-hidden="true" />
    </Link>
  );
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [type, setType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    getVehicles()
      .then((data) => setVehicles(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = type === "All" ? vehicles : vehicles.filter((v) => v.type === type);

  /* arrows slide the row by about two cards */
  const slide = (dir) =>
    trackRef.current?.scrollBy({ left: dir * 680, behavior: "smooth" });

  const pick = (t) => {
    setType(t);
    trackRef.current?.scrollTo({ left: 0 });
  };

  return (
    <>
      <div className="vh-bg" aria-hidden="true" />
      <HomeTab />

      <section className="vh-page">
        <header className="vh-head">
          <h2>Available vehicles</h2>
          <p className="vh-sub">
            {loading
              ? "Getting the fleet ready..."
              : `${filtered.length} ${filtered.length === 1 ? "vehicle" : "vehicles"} ready to book`}
          </p>
        </header>

        <div className="vh-bar">
          <div className="vh-filters">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={t === type ? "vh-chip active" : "vh-chip"}
                onClick={() => pick(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="vh-nav">
            <button type="button" className="vh-arrow" aria-label="Previous" onClick={() => slide(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="vh-arrow" aria-label="Next" onClick={() => slide(1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="vh-track" ref={trackRef}>
          {loading ? (
            <p className="vh-msg">Loading vehicles...</p>
          ) : error ? (
            <p className="vh-msg vh-error">Could not load vehicles. Please try again.</p>
          ) : filtered.length === 0 ? (
            <p className="vh-msg">No {type.toLowerCase()} vehicles found. Try another type.</p>
          ) : (
            filtered.map((v, i) => (
              <div key={v.id} className="vh-item" style={{ "--i": i }}>
                <VehicleCard vehicle={v} />
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}