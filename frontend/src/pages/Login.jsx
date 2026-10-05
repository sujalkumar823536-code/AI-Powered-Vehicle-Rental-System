import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  /* The page the visitor came from; home if there isn't one */
  const from = location.state?.from?.pathname;
  const back = from && from !== "/login" && from !== "/register" ? from : "/";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(back, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.response ? "Could not log in. Check your email and password." : "Cannot reach the server. Check that the backend is running.")
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
          <h2>Welcome back</h2>
          <p className="au-sub">Log in to book a vehicle and manage your trips.</p>

          {error && <p className="au-error" role="alert">{error}</p>}

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
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              <button type="button" className="au-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <button className="au-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="au-switch">
            New here? <Link to="/register" state={location.state}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}