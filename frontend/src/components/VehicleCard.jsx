import { useRef } from "react";
import { Link } from "react-router-dom";
import BikeFrames from "./BikeFrames";

/* Simple line-art bodies for each type. Unknown types fall back to Hatchback. */
const SHAPES = {
  Hatchback: {
    body: "M14 72V62Q14 56 22 54L44 50L60 32Q64 28 72 28H132Q142 28 150 36L166 52L196 56Q206 58 206 66V72Z",
    glass: "M66 48L74 34H98V48ZM104 48V34H130Q136 34 140 39L150 48Z",
  },
  SUV: {
    body: "M14 72V58Q14 52 22 50L40 46L54 24Q58 20 66 20H150Q158 20 164 28L176 46L198 52Q206 54 206 62V72Z",
    glass: "M58 44L64 28H96V44ZM102 44V28H146Q152 28 156 33L166 44Z",
  },
  MPV: {
    body: "M14 72V60Q14 54 22 52L40 48L52 26Q56 22 64 22H160Q170 22 176 32L184 48L198 54Q206 56 206 64V72Z",
    glass: "M56 46L62 30H92V46ZM98 46V30H128V46ZM134 46V30H162Q168 30 171 36L177 46Z",
  },
};

/* Photos in /public. The first word that matches the vehicle name wins.
   A vehicle can also carry its own "image" field, which is used first. */
const PHOTOS = [
  ["nexon", "/nexon.jpg"],
  ["innova", "/Innova.jpg"],
  ["meteor", "/meteor.jpg"],
  ["thar", "/thar.jpg"],
  ["creta", "/Creta.jpg"],
  ["swift", "/swift.jpg"],
  ["classic", "/classic.jpg"],
];
function photoFor(v) {
  if (v.image) return v.image;
  if (v.imageUrl) return v.imageUrl;
  const name = (v.name || "").toLowerCase();
  const hit = PHOTOS.find(([key]) => name.includes(key));
  return hit ? hit[1] : null;
}

function Wheel({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="vc-wheel">
        <circle className="vc-tire" r={r} />
        <circle className="vc-hub" r={r * 0.42} />
        <path className="vc-hub" d={`M0 ${-r * 0.42}V${r * 0.42}M${-r * 0.42} 0H${r * 0.42}`} />
      </g>
    </g>
  );
}

function Art({ type }) {
  const s = SHAPES[type] || SHAPES.Hatchback;
  return (
    <svg viewBox="0 0 220 100" aria-hidden="true">
      <path className="vc-road" d="M0 92H220" />
      <g className="vc-car-g">
        <path className="vc-body" d={s.body} />
        <path className="vc-glass" d={s.glass} />
        <Wheel x={56} y={74} r={15} />
        <Wheel x={164} y={74} r={15} />
      </g>
    </svg>
  );
}

export default function VehicleCard({ vehicle }) {
  const ref = useRef(null);
  const photo = photoFor(vehicle);

  /* Tilt toward the mouse and move the glow under the cursor */
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 12}deg`);
    el.style.setProperty("--rx", `${-py * 12}deg`);
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  return (
    <article className="vc-card" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="vc-top">
        <div>
          <span className="vc-type">{vehicle.type}</span>
          <h3 className="vc-name">{vehicle.name}</h3>
        </div>
        <span className={vehicle.available ? "vc-tag ok" : "vc-tag off"}>
          {vehicle.available ? "Available" : "Booked"}
        </span>
      </div>

      <div className="vc-art">
        {photo ? (
          <div className="vc-photo">
            <img src={photo} alt={vehicle.name} loading="lazy" />
          </div>
        ) : vehicle.type === "Bike" ? (
          <BikeFrames />
        ) : (
          <Art type={vehicle.type} />
        )}
      </div>

      <div className="vc-specs">
        <span className="vc-spec">{vehicle.seats} seats</span>
        <span className="vc-spec">{vehicle.fuel}</span>
      </div>

      <div className="vc-bottom">
        <div className="vc-price">
          ₹{vehicle.pricePerDay}<small>/day</small>
        </div>
        <Link to={`/vehicles/${vehicle.id}`} className="vc-btn">View details</Link>
      </div>
    </article>
  );
}