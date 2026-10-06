/* File names in /public. Keep the capital letters exactly as they are on disk */
const PHOTOS = {
  classic: "/classic.jpg",
  creta: "/Creta.jpg",
  innova: "/Innova.jpg",
  meteor: "/meteor.jpg",
  nexon: "/nexon.jpg",
  swift: "/swift.jpg",
  thar: "/thar.jpg",
};

export function photoFor(name = "") {
  const n = name.toLowerCase();
  const key = Object.keys(PHOTOS).find((k) => n.includes(k));
  return key ? PHOTOS[key] : undefined;
}

/* Bikes that have a turntable frame folder in /public */
const SPINS = {
  meteor: { folder: "/meteor-jpg", frameCount: 300 },
  classic: { folder: "/classic-jpg", frameCount: 300 },
  swift: { folder: "/swift-jpg", frameCount: 300 },
  thar: { folder: "/thar-jpg", frameCount: 300 },
  creta: { folder: "/Creta-jpg", frameCount: 300 },
  innova: { folder: "/Innova-jpg", frameCount: 300 },
  nexon: { folder: "/nexon-jpg", frameCount: 300 },
  // add prefix: "...", ext: "png" here if your file names differ
};

export function spinFor(name = "") {
  const n = name.toLowerCase();
  const key = Object.keys(SPINS).find((k) => n.includes(k));
  return key ? SPINS[key] : undefined;
}