import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./DetailForm.css";

/**
 * "Fill your details" popup shown after the person picks dates and presses
 * Continue. Calls onSubmit(details) once everything is valid.
 *
 * Props
 *   vehicle   { name, price }          e.g. { name: "Royal Enfield Classic", price: 900 }
 *   pickup    "2026-10-10"             the dates chosen on the detail page
 *   dropoff   "2026-10-12"
 *   total     number                   total price for the dates
 *   error     string                   booking error from the server, shown inside the popup
 *   onClose   () => void
 *   onSubmit  (details) => void | Promise
 */
const EMPTY = { fullName: "", phone: "", email: "", licence: "", location: "", notes: "" };

const RULES = {
  fullName: (v) => (v.trim().length >= 3 ? "" : "Enter your full name"),
  phone: (v) => (/^[6-9]\d{9}$/.test(v.replace(/\s|-/g, "")) ? "" : "Enter a 10-digit mobile number"),
  email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? "" : "Enter a valid email address"),
  licence: (v) => (v.replace(/\s|-/g, "").length >= 10 ? "" : "Enter your driving licence number"),
  location: (v) => (v.trim() ? "" : "Tell us where you want to pick up"),
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function DetailForm({ vehicle, pickup, dropoff, total, error, onClose, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const firstRef = useRef(null);
  const errorRef = useRef(null);

  /* Always read the latest props inside the key handler, without re-running the effect */
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    firstRef.current?.focus(); // once, when the popup opens
    const onKey = (e) => e.key === "Escape" && !busyRef.current && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  /* When a server error arrives, scroll it into view so it can't be missed */
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [error]);

  const errors = {};
  Object.keys(RULES).forEach((k) => {
    const msg = RULES[k](values[k]);
    if (msg) errors[k] = msg;
  });

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) {
      setTouched({ fullName: true, phone: true, email: true, licence: true, location: true });
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        ...values,
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/\s|-/g, ""),
        email: values.email.trim(),
        licence: values.licence.replace(/\s|-/g, "").toUpperCase(),
      });
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, props = {}) => (
    <label className={`bf-field ${touched[k] && errors[k] ? "bad" : ""}`}>
      <span className="bf-label">{label}</span>
      <input
        value={values[k]}
        onChange={set(k)}
        onBlur={blur(k)}
        aria-invalid={Boolean(touched[k] && errors[k])}
        {...props}
        ref={k === "fullName" ? firstRef : undefined}
      />
      {touched[k] && errors[k] && <span className="bf-error">{errors[k]}</span>}
    </label>
  );

  /* Portal: the popup is drawn on <body>, so the chat button and side tabs can't sit on top of it */
  return createPortal(
    <div className="bf-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="bf-modal" role="dialog" aria-modal="true" aria-labelledby="bf-title" onSubmit={submit} noValidate>
        <button type="button" className="bf-x" onClick={onClose} aria-label="Close" disabled={busy}>
          ×
        </button>

        <h2 id="bf-title">Your details</h2>
        <p className="bf-sub">We need these to confirm your booking.</p>

        <div className="bf-summary">
          <div>
            <strong>{vehicle?.name}</strong>
            <span>
              {fmt(pickup)} to {fmt(dropoff)}
            </span>
          </div>
          {total != null && <b>₹{Number(total).toLocaleString("en-IN")}</b>}
        </div>

        <div className="bf-grid">
          {field("fullName", "Full name", { placeholder: "As on your licence", autoComplete: "name" })}
          {field("phone", "Mobile number", { placeholder: "10-digit number", inputMode: "numeric", autoComplete: "tel" })}
          {field("email", "Email", { type: "email", placeholder: "you@example.com", autoComplete: "email" })}
          {field("licence", "Driving licence number", { placeholder: "e.g. KL0720240001234" })}
        </div>

        {field("location", "Pick-up location", { placeholder: "Where should we hand over the vehicle?" })}

        <label className="bf-field">
          <span className="bf-label">Notes (optional)</span>
          <textarea rows={2} value={values.notes} onChange={set("notes")} placeholder="Anything we should know?" />
        </label>

        <p className="bf-hint">Bring the same licence when you collect the vehicle.</p>

        {error && (
          <p className="bf-fail" role="alert" ref={errorRef}>
            {error}
          </p>
        )}

        <div className="bf-actions">
          <button type="button" className="bf-ghost" onClick={onClose} disabled={busy}>
            Back
          </button>
          <button type="submit" className="bf-go" disabled={busy}>
            {busy ? "Confirming…" : "Confirm booking"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}