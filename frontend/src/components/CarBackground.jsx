import { useEffect, useRef } from "react";
import "./CarBackground.css";

const NS = "http://www.w3.org/2000/svg";

/**
 * Full-screen "pull to reveal" car animation, used as a page background.
 * Frames are loaded from /public/<folder>/<prefix>001.jpg ... <prefix>300.jpg
 *
 * Usage (Home page):
 *   <CarBackground />
 *   <main style={{ position: "relative", zIndex: 1 }}>...your content...</main>
 */
export default function CarBackground({
  frameCount = 300,
  pad = 3,
  folder = "/car-jpg",
  prefix = "ezgif-frame-",
  ext = "jpg",
  fit = "cover", // "cover" fills the screen, "contain" shows the whole photo
  side = "right", // which way the half-circle bulges: "right" | "left"
  startFrame = 90, // pulling the handle to this frame starts the video
  playFps = 30,
  endPause = 1200, // ms to wait at the end before rewinding
  rewindMs = 1500, // ms to return to the start (0 = instant)
  captions = [], // optional: [{ text: "Pull to begin", start: 0.02, end: 0.25 }]
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const $ = (s) => root.querySelector(s);

    const canvas = $(".cb-canvas");
    const ctx = canvas.getContext("2d");
    const gauge = $(".cb-gauge");
    const svg = $(".cb-svg");
    const knob = $(".cb-knob");
    const fillPath = $(".cb-fill");
    const glowPath = $(".cb-glow");
    const sparks = $(".cb-sparks");
    const flash = $(".cb-flash");
    const loader = $(".cb-loader");
    const bar = $(".cb-bar span");
    const pct = $(".cb-pct");
    const capEls = [...root.querySelectorAll(".cb-caption")];

    const framePath = (i) =>
      `${folder}/${prefix}${String(i).padStart(pad, "0")}.${ext}`;
    const TRIGGER = (startFrame - 1) / frameCount;

    const images = new Array(frameCount);
    let loaded = 0;
    let currentFrame = 0;
    let disposed = false;
    let raf = null;
    let endTimer = null;

    /* ---------- Drawing ---------- */
    function draw(index) {
      const img = images[index];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width, ch = canvas.height;
      const scale =
        fit === "cover"
          ? Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
          : Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      draw(currentFrame);
    }
    window.addEventListener("resize", resize);

    /* ---------- Half-circle geometry ---------- */
    const S = side === "left" ? -1 : 1;
    const CX = S > 0 ? 40 : 220, CY = 200, R = 170;

    // p = 0 is the bottom (start circle), p = 1 is the top
    function pt(p, r = R) {
      const a = -Math.PI / 2 + Math.PI * p;
      return { x: CX + S * r * Math.cos(a), y: CY - r * Math.sin(a) };
    }
    const arcD = `M ${CX} ${CY + R} A ${R} ${R} 0 0 ${S > 0 ? 0 : 1} ${CX} ${CY - R}`;
    ["cb-track", "cb-glow", "cb-fill"].forEach((c) =>
      $("." + c).setAttribute("d", arcD)
    );
    const start = pt(0);
    [".cb-startDot", ".cb-pulse"].forEach((sel) => {
      const c = $(sel);
      c.setAttribute("cx", start.x);
      c.setAttribute("cy", start.y);
    });

    /* ---------- Effects ---------- */
    function spark(p) {
      const c = pt(p), el = document.createElementNS(NS, "circle");
      el.setAttribute("cx", c.x);
      el.setAttribute("cy", c.y);
      el.setAttribute("r", 2 + Math.random() * 3);
      el.setAttribute("fill", Math.random() > 0.4 ? "#ff2b2b" : "#ff9a6b");
      sparks.appendChild(el);
      const dx = S * (10 + Math.random() * 50), dy = (Math.random() - 0.5) * 60;
      const an = el.animate(
        [
          { opacity: 1, transform: "translate(0,0)" },
          { opacity: 0, transform: `translate(${dx}px,${dy}px)` },
        ],
        { duration: 500 + Math.random() * 300, easing: "ease-out" }
      );
      an.onfinish = () => el.remove();
    }
    function burst(p) {
      const c = pt(p), ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", c.x);
      ring.setAttribute("cy", c.y);
      ring.setAttribute("r", 16);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "#ff2b2b");
      ring.setAttribute("stroke-width", 4);
      ring.style.transformBox = "fill-box";
      ring.style.transformOrigin = "center";
      sparks.appendChild(ring);
      ring.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(7)", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out" }
      ).onfinish = () => ring.remove();
      for (let i = 0; i < 14; i++) spark(p);
      const k = knob.getBoundingClientRect();
      flash.style.setProperty("--fx", ((k.left + k.width / 2) / window.innerWidth) * 100 + "%");
      flash.style.setProperty("--fy", ((k.top + k.height / 2) / window.innerHeight) * 100 + "%");
      flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: "ease-out" });
    }

    /* ---------- State ---------- */
    let p = 0;
    let mode = "idle"; // idle | drag | auto | rewind
    let dragging = false;
    let lastSpark = 0;

    function render() {
      const f = Math.min(frameCount - 1, Math.floor(p * frameCount));
      if (f !== currentFrame) {
        currentFrame = f;
        draw(f);
      }
      const k = pt(p);
      knob.setAttribute("cx", k.x);
      knob.setAttribute("cy", k.y);
      knob.setAttribute("aria-valuenow", f + 1);
      fillPath.setAttribute("stroke-dashoffset", 1 - p);
      glowPath.setAttribute("stroke-dashoffset", 1 - p);
      glowPath.style.opacity = p > 0.01 ? 0.25 + 0.75 * p : 0;

      capEls.forEach((c) => {
        const s = parseFloat(c.dataset.start), e = parseFloat(c.dataset.end);
        c.classList.toggle("show", mode !== "rewind" && p >= s && p <= e);
      });
    }

    function setMode(m) {
      mode = m;
      gauge.classList.toggle("idle", m === "idle");
      gauge.classList.toggle("busy", m === "auto" || m === "rewind");
      gauge.classList.toggle("hidden", m === "auto");
    }

    function startAuto() {
      dragging = false;
      gauge.classList.remove("drag");
      burst(p);
      setMode("auto");
      let last = performance.now();
      const tick = (now) => {
        if (disposed) return;
        const dt = Math.min(now - last, 50);
        last = now;
        p = Math.min(1, p + ((dt / 1000) * playFps) / frameCount);
        render();
        if (p < 1) raf = requestAnimationFrame(tick);
        else endTimer = setTimeout(() => rewind(rewindMs), endPause);
      };
      raf = requestAnimationFrame(tick);
    }

    function rewind(ms) {
      if (disposed) return;
      setMode("rewind");
      if (ms <= 0) {
        p = 0;
        render();
        setMode("idle");
        return;
      }
      const from = p, t0 = performance.now();
      const tick = (now) => {
        if (disposed) return;
        const t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        p = from * (1 - e);
        render();
        if (t < 1) raf = requestAnimationFrame(tick);
        else {
          p = 0;
          render();
          setMode("idle");
        }
      };
      raf = requestAnimationFrame(tick);
    }

    function userMove(np, fromPointer) {
      if (mode === "auto" || mode === "rewind") return;
      const before = p;
      p = Math.min(1, Math.max(0, np));
      if (fromPointer) setMode("drag");
      render();
      const now = performance.now();
      if (Math.abs(p - before) > 0.002 && now - lastSpark > 40) {
        lastSpark = now;
        spark(p);
        spark(p);
      }
      if (p >= TRIGGER) {
        p = TRIGGER;
        render();
        startAuto();
      }
    }

    /* ---------- Pointer (mouse / touch) ---------- */
    function pointerToProgress(e) {
      const q = svg.createSVGPoint();
      q.x = e.clientX;
      q.y = e.clientY;
      const l = q.matrixTransform(svg.getScreenCTM().inverse());
      const dx = S * (l.x - CX), dy = CY - l.y;
      const a = dx < 0 ? (dy >= 0 ? Math.PI / 2 : -Math.PI / 2) : Math.atan2(dy, dx);
      return (a + Math.PI / 2) / Math.PI;
    }
    const release = () => {
      if (!dragging) return;
      dragging = false;
      gauge.classList.remove("drag");
      if (mode === "drag") rewind(Math.max(300, p * 900));
    };
    const onPointerMove = (e) => {
      if (mode !== "idle" && mode !== "drag") return;
      const k = knob.getBoundingClientRect();
      const d = Math.hypot(
        e.clientX - (k.left + k.width / 2),
        e.clientY - (k.top + k.height / 2)
      );
      if (!dragging) {
        if (mode === "idle" && d <= Math.max(k.width, 40)) {
          dragging = true;
          gauge.classList.add("drag");
        } else return;
      } else if (d > 150) {
        release();
        return;
      }
      userMove(pointerToProgress(e), true);
    };
    const onPointerUp = (e) => {
      if (e.pointerType === "touch") release();
    };
    document.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", release);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);

    /* ---------- Keyboard ---------- */
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") userMove(p + 0.04, false);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") userMove(p - 0.04, false);
      else if (e.key === "Enter" || e.key === " ") {
        if (mode === "idle") {
          p = TRIGGER;
          render();
          startAuto();
        }
      } else return;
      e.preventDefault();
    };
    knob.addEventListener("keydown", onKey);

    /* ---------- Preload frames, then reveal ---------- */
    function onDone() {
      if (disposed) return;
      loaded++;
      const v = Math.round((loaded / frameCount) * 100);
      bar.style.width = v + "%";
      pct.textContent = `Loading ${v}%`;
      if (loaded === frameCount) {
        loader.classList.add("done");
        resize();
        render();
      }
    }
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.onload = onDone;
      img.onerror = () => {
        console.warn("Missing frame:", framePath(i + 1));
        onDone();
      };
      img.src = framePath(i + 1);
      images[i] = img;
    }
    images[0].addEventListener("load", () => {
      resize();
      draw(0);
    });

    resize();
    render();

    /* ---------- Cleanup ---------- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(endTimer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", release);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
      knob.removeEventListener("keydown", onKey);
      images.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, [frameCount, pad, folder, prefix, ext, fit, side, startFrame, playFps, endPause, rewindMs]);

  return (
    <div className="cb-root" ref={rootRef} aria-hidden="false">
      <canvas className="cb-canvas" />
      <div className="cb-scrim" />
      <div className="cb-flash" />

      <div className={`cb-gauge idle cb-${side}`}>
        <svg className="cb-svg" viewBox="0 0 260 400" aria-label="Pull to play">
          <path className="cb-track" />
          <path className="cb-glow" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
          <path className="cb-fill" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
          <circle className="cb-pulse" r="16" />
          <circle className="cb-startDot" r="16" />
          <g className="cb-sparks" />
          <circle
            className="cb-knob"
            r="14"
            tabIndex={0}
            role="slider"
            aria-valuemin="1"
            aria-valuemax={frameCount}
            aria-valuenow="1"
            aria-label="Pull to play"
          />
        </svg>
      </div>

      {captions.map((c, i) => (
        <div key={i} className="cb-caption" data-start={c.start} data-end={c.end}>
          {c.text}
        </div>
      ))}

      <div className="cb-loader">
        <div className="cb-bar"><span /></div>
        <div className="cb-pct">Loading 0%</div>
      </div>
    </div>
  );
}