import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import "./VehicleTab.css";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CarIcon = () => (
  <svg className="vt-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v3h2m14-5a2 2 0 0 1 2 2v3h-2m-14 0h14M7 16v1.5m10-1.5v1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="13.5" r=".9" fill="currentColor" />
    <circle cx="16.5" cy="13.5" r=".9" fill="currentColor" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="vt-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* Left-edge tab: the next page opens as a circle growing from the tab */
function Tab({ to, label, icon }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      navigate(to);
      return;
    }

    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const t = document.startViewTransition(() => {
      flushSync(() => navigate(to));
    });

    t.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 900,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {});
  };

  return (
    <Link to={to} className="vt" aria-label={label} onClick={handleClick}>
      {icon}
      <span className="vt-text">{label}</span>
      <span className="vt-dot" aria-hidden="true" />
    </Link>
  );
}

/* Left edge, used on the home page */
export default function SideTabs({ showBookings = false }) {
  return (
    <div className="vt-stack">
      <Tab to="/vehicles" label="Discover models" icon={<CarIcon />} />
      {showBookings && <Tab to="/my-bookings" label="My bookings" icon={<CalendarIcon />} />}
    </div>
  );
}

/* Right-edge tab: the same cinematic fade as the Vehicles page
   (black fade, red line draws across, page changes, fade out) */
export function BackTab({ to = "/", label = "Back to home" }) {
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