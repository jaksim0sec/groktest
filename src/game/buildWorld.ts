import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CELL, RECTS, buildWalk, floorAt, type AABB, type FloorKind } from "./layout";
import { makeTextures, plainLabel, signTexture, type TexBag } from "./textures";

const H = 3.05;

export type Screen = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
};

export type World = {
  scene: THREE.Scene;
  walk: Set<string>;
  blocks: AABB[];
  door: THREE.Mesh;
  pharmacyMat: THREE.MeshStandardMaterial;
  pharmacyLight: THREE.PointLight;
  exitMat: THREE.MeshStandardMaterial;
  pickups: Map<string, THREE.Object3D>;
  cams: Screen;
  b2: Screen;
  clock: Screen;
  flicker: THREE.PointLight;
  dispose: () => void;
};

export function buildWorld(aniso: number): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc2bbb0);
  scene.fog = new THREE.FogExp2(0xc2bbb0, 0.028);
  scene.add(new THREE.HemisphereLight(0xf2eee6, 0x8d8478, 0.78));
  scene.add(new THREE.AmbientLight(0xc4bdae, 0.32));

  const tex = makeTextures(aniso);
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = Object.values(tex);
  const blocks: AABB[] = [];
  const pickups = new Map<string, THREE.Object3D>();

  const keepG = (g: THREE.BufferGeometry) => {
    geos.push(g);
    return g;
  };
  const keepM = <T extends THREE.Material>(m: T) => {
    mats.push(m);
    return m;
  };
  const keepT = (t: THREE.Texture) => {
    texs.push(t);
    return t;
  };

  const std = (color: string, rough = 0.7, metal = 0) =>
    keepM(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));

  const tileMat = (map: THREE.Texture, rough: number) =>
    keepM(new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0.04 }));

  const floorMats: Record<FloorKind, THREE.MeshStandardMaterial> = {
    tile: tileMat(tex.tile, 0.48),
    vinyl: tileMat(tex.vinyl, 0.72),
    concrete: tileMat(tex.concrete, 0.92),
  };
  const ceilMat = tileMat(tex.ceiling, 0.9);
  const wallTexMat = (len: number, height: number) => {
    const map = tex.wall.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(Math.max(1, len / 0.85), Math.max(1, height / 0.85));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;
    keepT(map);
    return keepM(new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0 }));
  };
  const shutterMat = (() => {
    const map = tex.shutter.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 4);
    map.anisotropy = aniso;
    map.colorSpace = THREE.SRGBColorSpace;
    keepT(map);
    return keepM(new THREE.MeshStandardMaterial({ map, roughness: 0.42, metalness: 0.22, color: "#c8c2b8" }));
  })();
  const pier = std("#ddd6cc", 0.85);
  const baseboard = std("#5e564e", 0.8);
  const metal = std("#8d8982", 0.4, 0.45);
  const white = std("#f3f1eb", 0.62);
  const wood = std("#8a6844", 0.72);
  const dark = std("#1c1e1c", 0.55, 0.08);
  const glass = keepM(
    new THREE.MeshStandardMaterial({
      color: "#c5dcec",
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
    }),
  );
  const tubeMat = keepM(
    new THREE.MeshStandardMaterial({ color: "#fff8ee", emissive: "#fff1d6", emissiveIntensity: 1.7, roughness: 0.35 }),
  );
  const pinkMat = keepM(
    new THREE.MeshStandardMaterial({ color: "#ffd0e4", emissive: "#ff7eb6", emissiveIntensity: 1.5, roughness: 0.4 }),
  );
  const ledMat = keepM(
    new THREE.MeshStandardMaterial({ color: "#d9ffe8", emissive: "#3ddc7a", emissiveIntensity: 1.4 }),
  );
  const exitMat = keepM(
    new THREE.MeshStandardMaterial({ color: "#e7fff1", emissive: "#1f8a4c", emissiveIntensity: 0.85, roughness: 0.4 }),
  );
  const pharmacyMat = keepM(
    new THREE.MeshStandardMaterial({ color: "#1a2420", emissive: "#10201c", emissiveIntensity: 0.15, roughness: 0.45 }),
  );

  const walk = buildWalk();
  layFloors(scene, walk, floorMats, ceilMat, keepG);

  const runnerMap = tex.runner.clone();
  runnerMap.wrapS = runnerMap.wrapT = THREE.RepeatWrapping;
  runnerMap.repeat.set(1, 28);
  runnerMap.colorSpace = THREE.SRGBColorSpace;
  runnerMap.anisotropy = aniso;
  keepT(runnerMap);
  const runner = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(1.05, 38)),
    keepM(new THREE.MeshStandardMaterial({ map: runnerMap, roughness: 0.62 })),
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(-0.42, 0.012, -3);
  scene.add(runner);

  const tactMap = tex.tactile.clone();
  tactMap.wrapS = tactMap.wrapT = THREE.RepeatWrapping;
  tactMap.repeat.set(1, 46);
  tactMap.colorSpace = THREE.SRGBColorSpace;
  tactMap.anisotropy = aniso;
  keepT(tactMap);
  const tact = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.62, 38)),
    keepM(new THREE.MeshStandardMaterial({ map: tactMap, roughness: 0.78 })),
  );
  tact.rotation.x = -Math.PI / 2;
  tact.position.set(0.92, 0.018, -3);
  scene.add(tact);

  buildWalls(scene, walk, wallTexMat, baseboard, keepG);

  const flicker = dressCorridor(scene, aniso, shutterMat, pier, pharmacyMat, keepG, keepM, keepT);
  const lamps = addLamps(scene, tubeMat, metal, keepG);
  const flickerLight = lamps;

  addProps(scene, {
    blocks,
    pickups,
    std,
    white,
    wood,
    dark,
    glass,
    metal,
    pinkMat,
    ledMat,
    exitMat,
    tubeMat,
    aniso,
    keepG,
    keepM,
    keepT,
    cams: null as unknown as Screen,
  });

  // screens created inside addProps — restructure to return them
  // (assigned below by rebuilding references from scene userData)
  const packed = scene.userData as {
    cams: Screen;
    b2: Screen;
    clock: Screen;
    door: THREE.Mesh;
    pharmacyLight: THREE.PointLight;
  };

  return {
    scene,
    walk,
    blocks,
    door: packed.door,
    pharmacyMat,
    pharmacyLight: packed.pharmacyLight,
    exitMat,
    pickups,
    cams: packed.cams,
    b2: packed.b2,
    clock: packed.clock,
    flicker: flickerLight,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      void flicker;
    },
  };
}

function layFloors(
  scene: THREE.Scene,
  walk: Set<string>,
  floorMats: Record<FloorKind, THREE.MeshStandardMaterial>,
  ceilMat: THREE.MeshStandardMaterial,
  keepG: (g: THREE.BufferGeometry) => THREE.BufferGeometry,
) {
  const buckets: Record<FloorKind, THREE.BufferGeometry[]> = { tile: [], vinyl: [], concrete: [] };
  const ceilings: THREE.BufferGeometry[] = [];
  for (const key of walk) {
    const [i, k] = key.split(",").map(Number) as [number, number];
    const cx = (i + 0.5) * CELL;
    const cz = (k + 0.5) * CELL;
    const kind = floorAt(cx, cz);
    const fg = new THREE.PlaneGeometry(CELL, CELL);
    fg.rotateX(-Math.PI / 2);
    fg.translate(cx, 0, cz);
    buckets[kind].push(fg);
    const cg = new THREE.PlaneGeometry(CELL, CELL);
    cg.rotateX(Math.PI / 2);
    cg.translate(cx, H, cz);
    ceilings.push(cg);
  }
  (Object.keys(buckets) as FloorKind[]).forEach((kind) => {
    const list = buckets[kind];
    if (!list.length) return;
    const merged = mergeGeometries(list);
    list.forEach((g) => g.dispose());
    if (!merged) return;
    scene.add(new THREE.Mesh(keepG(merged), floorMats[kind]));
  });
  const ceiling = mergeGeometries(ceilings);
  ceilings.forEach((g) => g.dispose());
  if (ceiling) scene.add(new THREE.Mesh(keepG(ceiling), ceilMat));
}

function buildWalls(
  scene: THREE.Scene,
  walk: Set<string>,
  wallTexMat: (len: number, height: number) => THREE.Material,
  base: THREE.Material,
  keepG: (g: THREE.BufferGeometry) => THREE.BufferGeometry,
) {
  let minI = Infinity;
  let maxI = -Infinity;
  let minK = Infinity;
  let maxK = -Infinity;
  for (const key of walk) {
    const [i, k] = key.split(",").map(Number) as [number, number];
    minI = Math.min(minI, i);
    maxI = Math.max(maxI, i);
    minK = Math.min(minK, k);
    maxK = Math.max(maxK, k);
  }
  const thick = 0.14;
  const add = (x: number, z: number, sx: number, sz: number) => {
    const len = Math.max(sx, sz);
    const mesh = new THREE.Mesh(keepG(new THREE.BoxGeometry(sx, H, sz)), wallTexMat(len, H));
    mesh.position.set(x, H / 2, z);
    scene.add(mesh);
    const alongX = sx >= sz;
    const b = new THREE.Mesh(
      keepG(new THREE.BoxGeometry(alongX ? sx : 0.05, 0.12, alongX ? 0.05 : sz)),
      base,
    );
    b.position.set(x, 0.06, z);
    scene.add(b);
  };

  const runZ = (dir: 1 | -1) => {
    for (let i = minI; i <= maxI; i++) {
      let start: number | null = null;
      for (let k = minK; k <= maxK + 1; k++) {
        const on =
          k <= maxK &&
          walk.has(i + "," + k) &&
          !walk.has(i + dir + "," + k);
        if (on && start === null) start = k;
        if (!on && start !== null) {
          const k0 = start;
          const k1 = k - 1;
          const z0 = k0 * CELL;
          const z1 = (k1 + 1) * CELL;
          const face = dir === 1 ? (i + 1) * CELL : i * CELL;
          const cx = face + dir * (thick / 2);
          add(cx, (z0 + z1) / 2, thick, z1 - z0 + thick);
          start = null;
        }
      }
    }
  };
  const runX = (dir: 1 | -1) => {
    for (let k = minK; k <= maxK; k++) {
      let start: number | null = null;
      for (let i = minI; i <= maxI + 1; i++) {
        const on =
          i <= maxI &&
          walk.has(i + "," + k) &&
          !walk.has(i + "," + (k + dir));
        if (on && start === null) start = i;
        if (!on && start !== null) {
          const i0 = start;
          const i1 = i - 1;
          const x0 = i0 * CELL;
          const x1 = (i1 + 1) * CELL;
          const face = dir === 1 ? (k + 1) * CELL : k * CELL;
          const cz = face + dir * (thick / 2);
          add((x0 + x1) / 2, cz, x1 - x0 + thick, thick);
          start = null;
        }
      }
    }
  };
  runZ(1);
  runZ(-1);
  runX(1);
  runX(-1);
}

function dressCorridor(
  scene: THREE.Scene,
  aniso: number,
  shutterMat: THREE.Material,
  pier: THREE.Material,
  pharmacyMat: THREE.Material,
  keepG: (g: THREE.BufferGeometry) => THREE.BufferGeometry,
  keepM: <T extends THREE.Material>(m: T) => T,
  keepT: (t: THREE.Texture) => THREE.Texture,
) {
  const westOpen: [number, number, string][] = [
    [11, 13.5, "출구 4"],
    [0.3, 3.7, "늘밤아이스"],
    [-10.5, -7.1, "늘밤세탁"],
  ];
  const eastOpen: [number, number, string][] = [
    [11.2, 13.5, "방재실"],
    [0.15, 3.7, "늘밤네컷"],
    [-13.7, -9.9, "늘밤노래"],
  ];
  const closedName = (z: number, side: "w" | "e") => {
    if (side === "w") {
      if (z > 6 && z < 10) return "양말할인";
      if (z > 4 && z < 6.2) return "네일";
      if (z > -2.2 && z < 0.1) return "열쇠";
      if (z > -17 && z < -14) return "휴대폰";
      return "";
    }
    if (z > 5 && z < 10) return "교복수선";
    if (z > -8 && z < -4.2) return "분식";
    if (z > -20 && z < -16) return "구두";
    return "";
  };

  const used = new Set<string>();
  const bay = (side: "w" | "e", z0: number, z1: number) => {
    const opens = side === "w" ? westOpen : eastOpen;
    const mid = (z0 + z1) / 2;
    const xFace = side === "w" ? -2.3 : 2.3;
    const inward = side === "w" ? 1 : -1;
    const open = opens.find(([a, b]) => mid > a && mid < b);
    if (open) {
      const t = signTexture(
        [
          { text: "늘밤", size: 28, color: "#8fd0c4", y: 48, weight: 700 },
          { text: open[2], size: 54, color: "#f4efe6", y: 120 },
        ],
        512,
        180,
        "#161a18",
        aniso,
      );
      keepT(t);
      const sign = new THREE.Mesh(
        keepG(new THREE.PlaneGeometry(1.55, 0.48)),
        keepM(new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })),
      );
      sign.position.set(xFace + inward * 0.04, 2.55, mid);
      sign.rotation.y = side === "w" ? Math.PI / 2 : -Math.PI / 2;
      scene.add(sign);
      return;
    }
    const len = z1 - z0 - 0.22;
    const shut = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.07, 2.7, Math.max(0.4, len))), shutterMat);
    shut.position.set(xFace - inward * 0.04, 1.35, mid);
    scene.add(shut);
    const p = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.18, H, 0.16)), pier);
    p.position.set(xFace + inward * 0.06, H / 2, z0);
    scene.add(p);
    const pharmacy = side === "w" && mid < -3.4 && mid > -5.8;
    let label = pharmacy ? "늘밤약국" : closedName(mid, side);
    const key = side + label;
    if (label && used.has(key)) label = "";
    if (label) used.add(key);
    if (!label) return;
    if (pharmacy) {
      const t = plainLabel(label, 512, 160, "#d7fff6", "#14211e", 64, aniso);
      keepT(t);
      const sign = new THREE.Mesh(
        keepG(new THREE.PlaneGeometry(1.35, 0.38)),
        keepM(new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, color: "#9fd9cf" })),
      );
      sign.position.set(xFace + inward * 0.06, 2.35, mid);
      sign.rotation.y = Math.PI / 2;
      scene.add(sign);
      const cross = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.05, 0.58, 0.16)), pharmacyMat);
      const bar = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.05, 0.16, 0.52)), pharmacyMat);
      cross.position.set(xFace + inward * 0.08, 1.7, mid);
      bar.position.set(xFace + inward * 0.08, 1.7, mid);
      scene.add(cross, bar);
      return;
    }
    const t = plainLabel(label, 512, 140, "#6d675f", "#d9d3c8", 60, aniso);
    keepT(t);
    const sign = new THREE.Mesh(
      keepG(new THREE.PlaneGeometry(1.3, 0.34)),
      keepM(new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })),
    );
    sign.position.set(xFace + inward * 0.05, 2.25, mid);
    sign.rotation.y = side === "w" ? Math.PI / 2 : -Math.PI / 2;
    scene.add(sign);
  };

  for (let z = -21; z < 15.2; z += 2.05) bay("w", z, z + 2.05);
  for (let z = -21; z < 15.2; z += 2.05) bay("e", z, z + 2.05);

  const north = signTexture(
    [
      { text: "늘밤", size: 26, color: "#8fd0c4", y: 42 },
      { text: "스터디", size: 58, color: "#f4efe6", y: 110 },
    ],
    512,
    180,
    "#161a18",
    aniso,
  );
  keepT(north);
  const nsign = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(1.6, 0.5)),
    keepM(new THREE.MeshStandardMaterial({ map: north, roughness: 0.55 })),
  );
  nsign.position.set(0, 2.5, -21.35);
  scene.add(nsign);

  const dir = document.createElement("canvas");
  dir.width = 1280;
  dir.height = 560;
  const g = dir.getContext("2d")!;
  g.fillStyle = "#14181c";
  g.fillRect(0, 0, 1280, 560);
  g.fillStyle = "#8fd0c4";
  g.fillRect(56, 44, 120, 10);
  g.font = '700 78px "Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';
  g.fillStyle = "#f4efe6";
  g.fillText("서림역 지하상가", 56, 150);
  g.font = '500 58px "Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';
  g.fillText("←  출구 4", 56, 270);
  g.fillText("↑  스터디", 56, 370);
  g.fillText("→  방재실", 640, 270);
  g.fillText("↓  개찰 폐쇄", 640, 370);
  g.fillStyle = "#1c2826";
  g.fillRect(860, 430, 360, 90);
  g.fillStyle = "#8fd0c4";
  g.font = '700 48px "Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';
  g.fillText("필름  7", 900, 490);
  const dtex = new THREE.CanvasTexture(dir);
  dtex.colorSpace = THREE.SRGBColorSpace;
  dtex.anisotropy = aniso;
  keepT(dtex);
  const hang = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(3.05, 1.32)),
    keepM(new THREE.MeshStandardMaterial({ map: dtex, roughness: 0.7, side: THREE.DoubleSide })),
  );
  hang.position.set(0, 2.22, 7.6);
  scene.add(hang);
  const rod = new THREE.Mesh(keepG(new THREE.CylinderGeometry(0.02, 0.02, 0.28)), pier);
  rod.position.set(-1.05, 2.92, 7.6);
  const rod2 = rod.clone();
  rod2.position.x = 1.05;
  scene.add(rod, rod2);

  return 0;
}

function addLamps(scene: THREE.Scene, tubeMat: THREE.Material, metal: THREE.Material, keepG: (g: THREE.BufferGeometry) => THREE.BufferGeometry) {
  const spots: [number, number, number, number][] = [
    [0, 12.2, 0xfff3e2, 36],
    [0, 4.2, 0xfff3e2, 34],
    [0, -4.2, 0xfff3e2, 28],
    [0, -12.5, 0xfff3e2, 32],
    [0, -20, 0xfff3e2, 30],
    [-7.2, 2.2, 0xd7ecff, 26],
    [-7.4, -9.4, 0xc9d6ff, 24],
    [6.8, 2.2, 0xffc4de, 22],
    [7, -12.4, 0xffd0dc, 20],
    [0, -28.5, 0xffe0b8, 26],
    [5.6, 12.6, 0xe7ffe4, 18],
    [-6, 12.4, 0xfff6e8, 16],
    [0, -35.5, 0xfff0cc, 12],
  ];
  let flicker: THREE.PointLight | null = null;
  for (const [x, z, color, intensity] of spots) {
    const house = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.36, 0.07, 1.15)), metal);
    house.position.set(x, 2.98, z);
    const tube = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.16, 0.03, 1.02)), tubeMat);
    tube.position.set(x, 2.93, z);
    scene.add(house, tube);
    const light = new THREE.PointLight(color, intensity, 12, 2);
    light.position.set(x, 2.65, z);
    scene.add(light);
    if (z === 4.2) flicker = light;
  }
  return flicker ?? new THREE.PointLight(0xffffff, 0, 1);
}

type Kit = {
  blocks: AABB[];
  pickups: Map<string, THREE.Object3D>;
  std: (color: string, rough?: number, metal?: number) => THREE.MeshStandardMaterial;
  white: THREE.Material;
  wood: THREE.Material;
  dark: THREE.Material;
  glass: THREE.Material;
  metal: THREE.Material;
  pinkMat: THREE.Material;
  ledMat: THREE.Material;
  exitMat: THREE.Material;
  tubeMat: THREE.Material;
  aniso: number;
  keepG: (g: THREE.BufferGeometry) => THREE.BufferGeometry;
  keepM: <T extends THREE.Material>(m: T) => T;
  keepT: (t: THREE.Texture) => THREE.Texture;
  cams: Screen;
};

function screenOf(w: number, h: number, aniso: number, keepT: (t: THREE.Texture) => THREE.Texture): Screen {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#10140f";
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  keepT(tex);
  return { canvas, ctx, tex };
}

function addProps(scene: THREE.Scene, k: Kit) {
  const { blocks, pickups, keepG, keepM, keepT, aniso } = k;
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(keepG(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };
  const block = (minX: number, maxX: number, minZ: number, maxZ: number, tag?: string) => {
    blocks.push({ minX, maxX, minZ, maxZ, tag });
  };

  // security desk, monitors, notebook, coat, clock
  box(2.3, 0.74, 1.45, k.wood, 6.75, 0.37, 12.35);
  block(5.6, 7.9, 11.62, 13.08);
  box(0.9, 0.7, 0.7, k.wood, 6.7, 0.35, 13.95);
  block(6.25, 7.15, 13.6, 14.3);
  const cams = screenOf(1024, 512, aniso, keepT);
  const camMat = keepM(new THREE.MeshStandardMaterial({ map: cams.tex, emissive: "#9bbaa4", emissiveIntensity: 0.35, roughness: 0.4 }));
  const camMesh = new THREE.Mesh(keepG(new THREE.PlaneGeometry(1.7, 0.72)), camMat);
  camMesh.position.set(5.52, 1.2, 12.15);
  camMesh.rotation.y = -Math.PI / 2;
  scene.add(camMesh);
  const b2 = screenOf(512, 512, aniso, keepT);
  const b2Mat = keepM(new THREE.MeshStandardMaterial({ map: b2.tex, emissive: "#9bbaa4", emissiveIntensity: 0.28, roughness: 0.45 }));
  const b2Mesh = new THREE.Mesh(keepG(new THREE.PlaneGeometry(0.42, 0.42)), b2Mat);
  b2Mesh.position.set(5.52, 1.18, 13.0);
  b2Mesh.rotation.y = -Math.PI / 2;
  scene.add(b2Mesh);
  box(0.08, 0.5, 0.5, k.dark, 7.55, 1.15, 14.7);
  box(0.32, 0.7, 0.28, k.std("#243044"), 7.15, 0.9, 14.55);
  const clock = screenOf(512, 220, aniso, keepT);
  const clockMesh = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.7, 0.3)),
    keepM(new THREE.MeshStandardMaterial({ map: clock.tex, emissive: "#cfe8c8", emissiveIntensity: 0.4 })),
  );
  clockMesh.position.set(7.9, 1.7, 11.2);
  clockMesh.rotation.y = -Math.PI / 2;
  scene.add(clockMesh);
  const book = box(0.28, 0.04, 0.2, k.std("#efe6d4"), 6.45, 0.73, 13.95);
  pickups.set("handover", book);

  // ice
  const freezer = (z: number, open = false) => {
    box(1.5, 0.86, 0.78, k.white, -9.85, 0.43, z);
    const stripe = new THREE.Mesh(
      keepG(new THREE.BoxGeometry(1.35, 0.08, 0.02)),
      keepM(new THREE.MeshStandardMaterial({ color: "#e7fff8", emissive: "#7ed9c8", emissiveIntensity: 0.6 })),
    );
    stripe.position.set(-9.85, 0.62, z + 0.4);
    scene.add(stripe);
    const top = new THREE.Mesh(keepG(new THREE.BoxGeometry(1.28, 0.04, 0.62)), k.glass);
    top.position.set(-9.85, open ? 1.05 : 0.88, z + (open ? 0.05 : 0));
    if (open) top.rotation.x = -0.9;
    scene.add(top);
    block(-10.65, -9.05, z - 0.42, z + 0.42);
  };
  freezer(0.2);
  freezer(2.1, true);
  freezer(4.0);
  box(0.62, 1.4, 0.5, k.dark, -6.25, 0.7, 4.15);
  block(-6.6, -5.9, 3.85, 4.5);
  const screen = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.4, 0.55)),
    keepM(
      new THREE.MeshStandardMaterial({
        map: keepT(plainLabel("늘밤아이스", 256, 320, "#e7fff8", "#10211e", 42, aniso)),
        emissive: "#8fd0c4",
        emissiveIntensity: 0.35,
      }),
    ),
  );
  screen.position.set(-5.98, 1.05, 4.15);
  screen.rotation.y = Math.PI / 2;
  scene.add(screen);
  const receipt = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.16, 0.22)),
    keepM(new THREE.MeshStandardMaterial({ color: "#f7f1e4", roughness: 0.7 })),
  );
  receipt.rotation.x = -Math.PI / 2;
  receipt.rotation.z = 0.4;
  receipt.position.set(-7.15, 0.02, 1.05);
  scene.add(receipt);
  pickups.set("receipt", receipt);
  const key = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.08, 0.02, 0.18)), k.metal);
  key.position.set(-7.55, 0.9, 4.55);
  scene.add(key);
  pickups.set("drawer-key", key);

  // laundry
  for (const x of [-10.3, -8.9, -7.5, -6.1]) {
    box(1.05, 1.12, 0.7, k.white, x, 0.62, -12.35);
    const door = new THREE.Mesh(keepG(new THREE.CircleGeometry(0.28, 18)), k.dark);
    door.position.set(x, 0.62, -11.98);
    scene.add(door);
    const led = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.05, 0.03, 0.02)), k.ledMat);
    led.position.set(x + 0.32, 1.05, -11.98);
    scene.add(led);
    block(x - 0.55, x + 0.55, -12.75, -11.95);
  }
  box(0.7, 1.35, 0.45, k.dark, -6.35, 0.68, -8.15);
  block(-6.75, -5.95, -8.45, -7.85);
  box(0.9, 1.5, 0.45, k.std("#c9c3b8"), -10.55, 0.75, -8.55);
  block(-11.05, -10.05, -8.85, -8.25);

  // photo booth
  box(0.12, 2.2, 3.1, k.std("#2a2428"), 9.85, 1.1, 3.9);
  box(2.4, 2.2, 0.1, k.std("#2a2428"), 8.6, 1.1, 5.45);
  box(2.4, 2.2, 0.1, k.std("#2a2428"), 8.6, 1.1, 2.35);
  block(9.7, 10.05, 2.4, 5.5);
  block(7.4, 9.9, 5.3, 5.6);
  block(7.4, 9.9, 2.2, 2.5);
  const curtain = new THREE.Mesh(keepG(new THREE.PlaneGeometry(1.5, 2.05)), k.std("#3a2433", 0.9));
  curtain.position.set(7.55, 1.15, 3.2);
  curtain.rotation.y = 0.5;
  scene.add(curtain);
  const curtain2 = curtain.clone();
  curtain2.position.set(7.55, 1.15, 4.7);
  curtain2.rotation.y = -0.5;
  scene.add(curtain2);
  const stool = new THREE.Mesh(keepG(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12)), k.metal);
  stool.position.set(8.35, 0.48, 3.95);
  const leg = new THREE.Mesh(keepG(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 8)), k.metal);
  leg.position.set(8.35, 0.23, 3.95);
  scene.add(stool, leg);
  const tube = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.08, 0.7, 0.08)), k.pinkMat);
  tube.position.set(9.55, 1.5, 5.1);
  scene.add(tube);
  box(1.4, 0.9, 0.45, k.dark, 5.1, 0.5, 4.6);
  const boothScreen = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.7, 0.45)),
    keepM(new THREE.MeshStandardMaterial({ color: "#2a121c", emissive: "#ff8eb8", emissiveIntensity: 0.7 })),
  );
  boothScreen.position.set(6.3, 1.35, 4.2);
  boothScreen.rotation.y = -0.6;
  scene.add(boothScreen);
  const loader = new THREE.TextureLoader();
  const stripTex = loader.load("/textures/strip.jpg");
  stripTex.colorSpace = THREE.SRGBColorSpace;
  stripTex.anisotropy = aniso;
  keepT(stripTex);
  const strip = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.2, 0.46)),
    keepM(new THREE.MeshStandardMaterial({ map: stripTex, roughness: 0.65 })),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(5.15, 0.025, 1.05);
  scene.add(strip);
  pickups.set("photostrip", strip);

  // karaoke room
  box(1.3, 2.15, 0.08, k.std("#4a3030"), 4.55, 1.08, -16.85);
  const dlabel = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.4, 0.28)),
    keepM(new THREE.MeshStandardMaterial({ map: keepT(plainLabel("1", 128, 96, "#f4efe6", "#7a2430", 64, aniso)), roughness: 0.5 })),
  );
  dlabel.position.set(4.55, 1.55, -16.78);
  scene.add(dlabel);
  box(2.2, 0.45, 0.7, k.std("#6a3a3a"), 8.3, 0.28, -19.15);
  block(7.2, 9.4, -19.55, -18.75);
  const tv = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(1.1, 0.62)),
    keepM(new THREE.MeshStandardMaterial({ color: "#2a1218", emissive: "#ff8eae", emissiveIntensity: 0.55 })),
  );
  tv.position.set(8.3, 1.35, -20.15);
  scene.add(tv);

  // study carrels — two columns down the aisle, 7번 at the north end
  const carrel = (x: number, z: number, num: string, lit = false) => {
    const sx = 1.05;
    const sz = 0.62;
    box(sx, 0.045, sz, k.wood, x, 0.72, z);
    box(0.05, 0.68, 0.05, k.dark, x - sx / 2 + 0.05, 0.34, z - sz / 2 + 0.05);
    box(0.05, 0.68, 0.05, k.dark, x + sx / 2 - 0.05, 0.34, z - sz / 2 + 0.05);
    box(0.05, 0.68, 0.05, k.dark, x - sx / 2 + 0.05, 0.34, z + sz / 2 - 0.05);
    box(0.05, 0.68, 0.05, k.dark, x + sx / 2 - 0.05, 0.34, z + sz / 2 - 0.05);
    box(sx, 0.46, 0.04, k.wood, x, 0.98, z - sz / 2);
    box(0.04, 0.4, sz, k.wood, x - Math.sign(x || 1) * (sx / 2), 0.94, z);
    const lab = new THREE.Mesh(
      keepG(new THREE.PlaneGeometry(0.24, 0.16)),
      keepM(
        new THREE.MeshStandardMaterial({
          map: keepT(plainLabel(num, 128, 96, lit ? "#1c1915" : "#f4efe6", lit ? "#f0d7a4" : "#2c2824", 64, aniso)),
          roughness: 0.55,
        }),
      ),
    );
    lab.position.set(x + 0.28, 1.08, z - sz / 2 + 0.03);
    scene.add(lab);
    box(0.36, 0.05, 0.36, k.dark, x, 0.46, z + 0.52);
    box(0.36, 0.28, 0.04, k.dark, x, 0.62, z + 0.68);
    if (lit) {
      const lamp = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.22, 0.04, 0.1)), k.tubeMat);
      lamp.position.set(x - 0.28, 0.78, z - 0.12);
      scene.add(lamp);
      const pl = new THREE.PointLight(0xffd7a8, 7, 3.4, 2);
      pl.position.set(x, 1.15, z);
      scene.add(pl);
      box(0.22, 0.008, 0.16, k.std("#f7f1e4"), x + 0.08, 0.75, z + 0.04);
    }
    block(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2);
  };
  carrel(-2.35, -26.7, "1");
  carrel(2.35, -26.7, "2");
  carrel(-2.35, -28.55, "3");
  carrel(2.35, -28.55, "4");
  carrel(-2.35, -30.4, "5");
  carrel(2.35, -30.4, "6");
  carrel(3.45, -31.85, "7", true);
  const rules = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.7, 0.9)),
    keepM(new THREE.MeshStandardMaterial({ map: keepT(plainLabel("이용수칙", 256, 320, "#1c1915", "#f3ecdf", 48, aniso)), roughness: 0.8 })),
  );
  rules.position.set(-2.2, 1.45, -24.45);
  scene.add(rules);

  // stairs
  for (let i = 0; i < 5; i++) {
    box(4.6, 0.16, 0.42, k.std("#b7b1a8"), -6, 0.08 + i * 0.16, 14.55 + i * 0.28);
  }
  const half = new THREE.Mesh(keepG(new THREE.BoxGeometry(4.8, 1.85, 0.08)), shutterMatSafe(k, keepM, keepT));
  half.position.set(-6, 2.1, 14.35);
  scene.add(half);
  block(-8.6, -3.4, 14.15, 14.9, "stair");
  const exit = new THREE.Mesh(keepG(new THREE.PlaneGeometry(0.7, 0.32)), k.exitMat);
  exit.position.set(-6, 2.55, 13.55);
  scene.add(exit);
  const exitText = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.62, 0.24)),
    keepM(new THREE.MeshStandardMaterial({ map: keepT(plainLabel("출구 4", 256, 96, "#f4fff8", "#14663a", 48, aniso)), roughness: 0.4 })),
  );
  exitText.position.set(-6, 2.55, 13.5);
  scene.add(exitText);

  // service rack + door
  box(1.15, 1.85, 0.5, k.dark, 0, 0.95, -37.85);
  block(-0.65, 0.65, -38.2, -37.5);
  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(keepG(new THREE.BoxGeometry(0.05, 0.05, 0.02)), i % 2 ? k.ledMat : k.std("#c4463a"));
    dot.position.set(-0.35, 1.5 - i * 0.22, -37.58);
    scene.add(dot);
  }
  const term = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.55, 0.36)),
    keepM(new THREE.MeshStandardMaterial({ color: "#102018", emissive: "#8fd0c4", emissiveIntensity: 0.45 })),
  );
  term.position.set(0.05, 1.25, -37.58);
  scene.add(term);
  const doorMat = keepM(new THREE.MeshStandardMaterial({ color: "#8a8680", roughness: 0.45, metalness: 0.3 }));
  const door = new THREE.Mesh(keepG(new THREE.BoxGeometry(3.15, 2.72, 0.1)), doorMat);
  door.position.set(0, 1.36, -33.05);
  const win = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(0.62, 0.22)),
    keepM(new THREE.MeshStandardMaterial({ color: "#14201c", emissive: "#8fd0c4", emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.35 })),
  );
  win.position.set(0, 0.55, 0.055);
  const bar = new THREE.Mesh(keepG(new THREE.BoxGeometry(1.35, 0.055, 0.05)), k.metal);
  bar.position.set(0, -0.28, 0.07);
  door.add(win, bar);
  scene.add(door);
  const doorSign = new THREE.Mesh(
    keepG(new THREE.PlaneGeometry(1.4, 0.32)),
    keepM(new THREE.MeshStandardMaterial({ map: keepT(plainLabel("설비 복도", 512, 128, "#f4efe6", "#2a2e2c", 52, aniso)), roughness: 0.5 })),
  );
  doorSign.position.set(0, 2.84, -32.9);
  scene.add(doorSign);
  block(-2.2, 2.2, -33.5, -32.55, "door");

  const pharmacyLight = new THREE.PointLight(0x9ef0df, 0, 6, 2);
  pharmacyLight.position.set(-1.7, 2.2, -4.55);
  scene.add(pharmacyLight);

  // bench, extinguisher, bin
  box(0.45, 0.45, 1.2, k.metal, 1.85, 0.25, 9.1);
  block(1.55, 2.15, 8.45, 9.75);
  const ext = new THREE.Mesh(keepG(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 10)), k.std("#b4332c", 0.5));
  ext.position.set(2.05, 0.3, 10.6);
  scene.add(ext);
  const bin = new THREE.Mesh(keepG(new THREE.CylinderGeometry(0.18, 0.16, 0.45, 10)), k.dark);
  bin.position.set(-1.85, 0.24, 5.2);
  scene.add(bin);

  scene.userData = { cams, b2, clock, door, pharmacyLight };
}

function shutterMatSafe(
  k: Kit,
  keepM: Kit["keepM"],
  _keepT: Kit["keepT"],
): THREE.Material {
  return keepM(new THREE.MeshStandardMaterial({ color: "#8e8a84", roughness: 0.45, metalness: 0.25 }));
}
