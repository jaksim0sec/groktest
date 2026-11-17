import * as THREE from "three";

const FONT = '"Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';

export type TexBag = {
  tile: THREE.CanvasTexture;
  vinyl: THREE.CanvasTexture;
  concrete: THREE.CanvasTexture;
  runner: THREE.CanvasTexture;
  tactile: THREE.CanvasTexture;
  wall: THREE.CanvasTexture;
  shutter: THREE.CanvasTexture;
  ceiling: THREE.CanvasTexture;
};

function canvasTex(c: HTMLCanvasElement, aniso: number, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function makeTextures(aniso: number): TexBag {
  return {
    tile: canvasTex(tileCanvas(), aniso),
    vinyl: canvasTex(vinylCanvas(), aniso),
    concrete: canvasTex(concreteCanvas(), aniso),
    runner: canvasTex(runnerCanvas(), aniso, true),
    tactile: canvasTex(tactileCanvas(), aniso, true),
    wall: canvasTex(wallCanvas(), aniso, true),
    shutter: canvasTex(shutterCanvas(), aniso, true),
    ceiling: canvasTex(ceilingCanvas(), aniso, true),
  };
}

function tileCanvas() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const n = noise(2, 5);
  const base = 198 + Math.floor(n * 18);
  g.fillStyle = `rgb(${base},${base - 6},${base - 14})`;
  g.fillRect(0, 0, s, s);
  const img = g.getImageData(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const speck = (noise(x, y) - 0.5) * 16;
      img.data[i] = Math.min(255, img.data[i]! + speck);
      img.data[i + 1] = Math.min(255, img.data[i + 1]! + speck);
      img.data[i + 2] = Math.min(255, img.data[i + 2]! + speck);
    }
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = "rgba(120,112,102,0.55)";
  g.fillRect(0, 0, s, 3);
  g.fillRect(0, 0, 3, s);
  return c;
}

function wallCanvas() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e3ddd4";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "rgba(150,144,134,0.45)";
  g.fillRect(0, 0, s, 2);
  g.fillRect(0, 0, 2, s);
  return c;
}

function vinylCanvas() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c6ae8c";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(90,64,40,0.18)";
  for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 128, 1);
  return c;
}

function concreteCanvas() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#7c7872";
  g.fillRect(0, 0, s, s);
  const img = g.getImageData(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const speck = (noise(x * 0.7, y * 1.3) - 0.5) * 28;
      img.data[i] = Math.max(0, img.data[i]! + speck);
      img.data[i + 1] = Math.max(0, img.data[i + 1]! + speck);
      img.data[i + 2] = Math.max(0, img.data[i + 2]! + speck);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function runnerCanvas() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#6d4e38";
  g.fillRect(0, 0, s, s);
  const img = g.getImageData(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const speck = (noise(x * 1.7, y * 0.4) - 0.5) * 40;
      img.data[i] = Math.max(0, Math.min(255, img.data[i]! + speck));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1]! + speck * 0.7));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2]! + speck * 0.45));
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function tactileCanvas() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c6a15a";
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = "#a8843e";
  for (let y = 8; y < 128; y += 28) g.fillRect(10, y, 44, 12);
  return c;
}

function shutterCanvas() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  for (let y = 0; y < 128; y++) {
    const band = Math.floor(y / 6) % 2;
    const v = band ? 92 : 122;
    g.fillStyle = `rgb(${v + 8},${v + 4},${v - 2})`;
    g.fillRect(0, y, 64, 1);
  }
  return c;
}

function ceilingCanvas() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e7e2da";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "rgba(160,154,144,0.7)";
  g.lineWidth = 2;
  g.strokeRect(1, 1, s - 2, s - 2);
  return c;
}

export function signTexture(
  lines: { text: string; size: number; color: string; y: number; weight?: number }[],
  w: number,
  h: number,
  bg: string,
  aniso: number,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#8fd0c4";
  g.fillRect(28, 28, 64, 8);
  for (const line of lines) {
    g.fillStyle = line.color;
    g.font = `${line.weight ?? 700} ${line.size}px ${FONT}`;
    g.textBaseline = "middle";
    g.fillText(line.text, 28, line.y);
  }
  return canvasTex(c, aniso);
}

export function plainLabel(text: string, w: number, h: number, fg: string, bg: string, size: number, aniso: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = `700 ${size}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2);
  return canvasTex(c, aniso);
}

export async function ensureFont() {
  if (!document.fonts) return;
  try {
    await Promise.race([
      document.fonts.load(`700 64px ${FONT}`),
      new Promise((r) => setTimeout(r, 2200)),
    ]);
    const probe = document.createElement("canvas").getContext("2d");
    if (probe) {
      probe.font = `700 48px ${FONT}`;
      probe.fillText("늘밤", 0, 40);
    }
  } catch {
    /* fallback font */
  }
}
