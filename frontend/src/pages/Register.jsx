import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const from = location.state?.from?.pathname;
  const back = from && from !== "/login" && from !== "/register" ? from : "/";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate(back, { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : err.response
          ? "Could not create the account. Check your details and try again."
          : "Cannot reach the server. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="au-page">
      <div className="au-wrap">
        <Link to="/" className="au-home">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>

        <form className="au-card" onSubmit={handleSubmit}>
          <span className="au-mark" aria-hidden="true" />
          <h2>Create your account</h2>
          <p className="au-sub">It takes a minute, and then you can book any car or bike.</p>

          {error && <p className="au-error" role="alert">{error}</p>}

          <label className="au-field">
            Full name
            <span className="au-input">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                required
              />
            </span>
          </label>

          <label className="au-field">
            Email
            <span className="au-input">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </span>
          </label>

          <label className="au-field">
            Password
            <span className="au-input has-toggle">
              <input
                type={show ? "text" : "password"}
                name="password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              <button type="button" className="au-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <button className="au-btn" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="au-switch">
            Already registered? <Link to="/login" state={location.state}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}