import { useEffect, useRef, useState } from "react";

/**
 * Bike turntable you control with the cursor: move left and right over the
 * picture to turn the bike. If the first frame can't be loaded, the poster
 * photo is shown instead.
 */
export default function BikeSpin({
  folder = "/bike-frames",
  prefix = "ezgif-frame-",
  ext = "jpg",
  pad = 3,
  frameCount = 25,
  poster = null,
  reverse = true, // true: the bike turns the same way your cursor moves. Set false to flip it back
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const movedRef = useRef(false);
  const [moved, setMoved] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const bar = barRef.current;
    if (!wrap || !canvas || !bar) return undefined;
    const ctx = canvas.getContext("2d");

    const path = (i) => `${folder}/${prefix}${String(i).padStart(pad, "0")}.${ext}`;
    const images = new Array(frameCount);
    let loaded = 0;
    let disposed = false;
    let current = 0;
    let target = 0;
    let drawn = -1;
    let raf = 0;

    const draw = (i) => {
      const img = images[i];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = i;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(wrap.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(wrap.clientHeight * dpr));
      draw(drawn < 0 ? 0 : drawn);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const onDone = () => {
      loaded++;
      bar.style.width = `${(loaded / frameCount) * 100}%`;
      if (loaded >= frameCount) bar.classList.add("done");
    };

    /* Check frame 1 first; only load the rest if it exists */
    const first = new Image();
    first.onerror = () => {
      disposed = true;
      cancelAnimationFrame(raf);
      setFailed(true);
    };
    first.onload = () => {
      if (disposed) return;
      images[0] = first;
      onDone();
      draw(0);
      for (let i = 1; i < frameCount; i++) {
        const img = new Image();
        img.onload = onDone;
        img.onerror = onDone;
        img.src = path(i + 1);
        images[i] = img;
      }
    };
    first.src = path(1);

    /* Cursor position across the picture picks the frame */
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      target = (reverse ? 1 - x : x) * (frameCount - 1);
      if (!movedRef.current) {
        movedRef.current = true;
        setMoved(true);
      }
    };
    wrap.addEventListener("pointermove", onMove);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      current += (target - current) * 0.18; // ease toward the cursor
      const idx = Math.round(current);
      if (idx !== drawn) draw(idx);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      first.onload = null;
      first.onerror = null;
    };
  }, [folder, prefix, ext, pad, frameCount, reverse]);

  if (failed) {
    return poster ? <img src={poster} alt="Vehicle" /> : <div className="vd-ph">Bike</div>;
  }

  return (
    <div className="vd-spin" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="vc-video-bar" ref={barRef} />
      </div>
  );
}