import "./ChatLauncher.css";

/**
 * Chat launcher button (bottom-right).
 * Props:
 *   open    - true while the chat panel is open (icon turns into an X)
 *   onClick - toggles the chat panel
 *   label   - text shown next to the icon
 */
export default function ChatLauncher({ open = false, onClick, label = "Ask the assistant" }) {
  return (
    <button
      type="button"
      className={`cl${open ? " cl-open" : ""}`}
      onClick={onClick}
      aria-label={open ? "Close chat" : label}
      aria-expanded={open}
    >
      <span className="cl-icon">
        <span className="cl-ring" aria-hidden="true" />
        <svg className="cl-chat" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="11" r="1.1" fill="currentColor" />
          <circle cx="12" cy="11" r="1.1" fill="currentColor" />
          <circle cx="15.5" cy="11" r="1.1" fill="currentColor" />
        </svg>
        <svg className="cl-close" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="cl-label">{open ? "Close chat" : label}</span>
    </button>
  );
}