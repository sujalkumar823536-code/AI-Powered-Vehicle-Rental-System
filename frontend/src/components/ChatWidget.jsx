import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { askAssistant } from "../api/chatApi";
import { useAuth } from "../context/AuthContext";
import ChatLauncher from "./ChatLauncher";
import "./ChatWidget.css";

/* The assistant ends a booking reply with:  [[book:<id>|<name>|<start>|<end>]]
   start and end (YYYY-MM-DD) are empty when the person gave no dates. */
const BOOK = /\[\[book:([a-f\d]{24})\|([^|\]]*)\|(\d{4}-\d{2}-\d{2})?\|(\d{4}-\d{2}-\d{2})?\]\]/gi;

function parse(text) {
  const links = [];
  const clean = text
    .replace(BOOK, (_, id, name, start, end) => {
      links.push({ id, name: name.trim() || "this vehicle", start, end });
      return "";
    })
    .replace(/\*\*(.+?)\*\*/g, "$1") // hide stray Markdown bold
    .trim();
  return { clean, links };
}

/* Link to the vehicle page. With both dates, the details popup opens by itself (book=1). */
function bookingPath({ id, start, end }) {
  const q = new URLSearchParams();
  if (start) q.set("start", start);
  if (end) q.set("end", end);
  if (start && end) q.set("book", "1");
  const s = q.toString();
  return `/vehicles/${id}${s ? `?${s}` : ""}`;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Tell me about your trip and I'll suggest a vehicle." },
  ]);
  const endRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /* Logged in: open the booking page. Guest: log in first, then come back to it. */
  const goBook = (link, next) => {
    const path = bookingPath(link);
    clearTimeout(timer.current);

    if (user) {
      timer.current = setTimeout(() => {
        setOpen(false);
        navigate(path);
      }, 1400);
      return;
    }

    setMessages([
      ...next,
      {
        role: "assistant",
        text: "Please log in first. I'll bring you straight back to this vehicle afterwards.",
      },
    ]);
    timer.current = setTimeout(() => {
      setOpen(false);
      navigate("/login", { state: { from: { pathname: path } } });
    }, 1800);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data } = await askAssistant(text, next);
      const withReply = [...next, { role: "assistant", text: data.reply }];
      setMessages(withReply);

      const { links } = parse(data.reply);
      if (links.length) goBook(links[0], withReply);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", text: "The assistant is unavailable right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="cw-panel" role="dialog" aria-label="Rental assistant">
          <div className="cw-header">
            <span className="cw-status" aria-hidden="true" />
            <div>
              <div className="cw-title">Rental assistant</div>
              <div className="cw-sub">Cars &amp; bikes, matched to your trip</div>
            </div>
            <button type="button" className="cw-x" aria-label="Close chat" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="cw-body" aria-live="polite">
            {messages.map((m, i) => {
              const { clean, links } = m.role === "assistant" ? parse(m.text) : { clean: m.text, links: [] };
              return (
                <div key={i} className={`cw-bubble cw-${m.role}`}>
                  {clean}
                  {links.map((l) => (
                    <Link
                      key={l.id}
                      to={bookingPath(l)}
                      className="cw-book"
                      onClick={() => {
                        clearTimeout(timer.current);
                        setOpen(false);
                      }}
                    >
                      Book {l.name}
                    </Link>
                  ))}
                </div>
              );
            })}
            {loading && (
              <div className="cw-bubble cw-assistant cw-typing" aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="cw-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. 7-seater for 3 days"
              aria-label="Your message"
            />
            <button type="button" className="cw-send" onClick={send} disabled={loading || !input.trim()} aria-label="Send">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <ChatLauncher open={open} onClick={() => setOpen(!open)} />
    </>
  );
}