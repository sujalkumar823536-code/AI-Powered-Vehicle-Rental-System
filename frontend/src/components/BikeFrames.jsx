import { useEffect, useRef } from "react";

/* Frames are shared between cards, so each image loads only once */
const cache = new Map();

function loadFrames({ folder, prefix, ext, pad, count }, onProgress) {
  const key = `${folder}|${prefix}|${count}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = { images: new Array(count), loaded: 0, subs: new Set() };
    cache.set(key, entry);
    for (let i = 0; i < count; i++) {
      const img = new Image();
      const done = () => {
        entry.loaded++;
        entry.subs.forEach((fn) => fn(entry.loaded));
      };
      img.onload = done;
      img.onerror = done;
      img.src = `${folder}/${prefix}${String(i + 1).padStart(pad, "0")}.${ext}`;
      entry.images[i] = img;
    }
  }
  entry.subs.add(onProgress);
  onProgress(entry.loaded);
  return { entry, off: () => entry.subs.delete(onProgress) };
}

export default function BikeFrames({
  folder = "/bike-frames",
  prefix = "ezgif-frame-",
  ext = "jpg",
  pad = 3,
  frameCount = 25, // set this to the number of your last frame
  fps = 24,
  pingPong = false, // true = play forward then backward (use if the loop jumps)
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const bar = barRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let entry = null;
    let off = null;
    let ready = false;
    let visible = false;
    let frame = 0;
    let dir = 1;
    let acc = 0;
    let last = 0;
    let raf = 0;

    const draw = (i) => {
      const img = entry?.images[i];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(wrap.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(wrap.clientHeight * dpr));
      draw(frame);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const onProgress = (loaded) => {
      bar.style.width = `${(loaded / frameCount) * 100}%`;
      if (!ready) draw(0); // show the first frame while the rest load
      if (loaded >= frameCount) {
        ready = true;
        bar.classList.add("done");
      }
    };

    const advance = () => {
      if (pingPong) {
        frame += dir;
        if (frame >= frameCount - 1) { frame = frameCount - 1; dir = -1; }
        else if (frame <= 0) { frame = 0; dir = 1; }
      } else {
        frame = (frame + 1) % frameCount;
      }
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible || !ready) { last = now; return; }
      acc = Math.min(acc + (now - last), 250);
      last = now;
      const step = 1000 / fps;
      while (acc >= step) { acc -= step; advance(); }
      draw(frame);
    };

    /* Start loading only when the card first appears on screen */
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !entry) {
        const res = loadFrames({ folder, prefix, ext, pad, count: frameCount }, onProgress);
        entry = res.entry;
        off = res.off;
      }
    });
    io.observe(wrap);

    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      if (off) off();
    };
  }, [folder, prefix, ext, pad, frameCount, fps, pingPong]);

  return (
    <div className="vc-video" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="vc-video-bar" ref={barRef} />
    </div>
  );
}