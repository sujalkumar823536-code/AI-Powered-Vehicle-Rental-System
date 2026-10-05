import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user = null, onLogout }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="nb">
      <nav className="nb-bar" aria-label="Main">
        <Link to="/" className="nb-logo" onClick={close}>
          <span className="nb-mark" aria-hidden="true" />
          DriveEasy
        </Link>

        <button
          type="button"
          className="nb-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="nb-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>

        <div id="nb-menu" className={`nb-menu${open ? " open" : ""}`}>
          <span className="nb-spacer" />

          <div className="nb-actions">
            {user ? (
              <button
                type="button"
                className="nb-logout"
                onClick={() => {
                  close();
                  onLogout && onLogout();
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Log out</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="nb-ghost" onClick={close}>Log in</Link>
                <Link to="/register" className="nb-cta" onClick={close}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}