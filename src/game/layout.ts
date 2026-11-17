export const CELL = 0.5;

export type FloorKind = "tile" | "vinyl" | "concrete";

export type Rect = {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floor: FloorKind;
};

export type AABB = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  tag?: string;
};

/** Walkable floor plan. Overlaps of ≥1m are doors. */
export const RECTS: Rect[] = [
  { id: "main", name: "주통로", minX: -2.3, maxX: 2.3, minZ: -22, maxZ: 16, floor: "tile" },
  { id: "secNeck", name: "방재실", minX: 1.4, maxX: 4.6, minZ: 11.2, maxZ: 13.5, floor: "tile" },
  { id: "security", name: "방재실", minX: 3.2, maxX: 8.4, minZ: 10, maxZ: 15.5, floor: "tile" },
  { id: "stairNeck", name: "출구 4", minX: -4.8, maxX: -1.3, minZ: 11, maxZ: 13.5, floor: "tile" },
  { id: "stairs", name: "출구 4", minX: -8.8, maxX: -3.3, minZ: 10.1, maxZ: 15.7, floor: "tile" },
  { id: "iceNeck", name: "늘밤아이스", minX: -5, maxX: -1.3, minZ: 0.3, maxZ: 3.7, floor: "tile" },
  { id: "ice", name: "늘밤아이스", minX: -11.1, maxX: -3.3, minZ: -1.9, maxZ: 6.1, floor: "tile" },
  { id: "lauNeck", name: "늘밤세탁", minX: -5, maxX: -1.3, minZ: -10.5, maxZ: -7.1, floor: "tile" },
  { id: "laundry", name: "늘밤세탁", minX: -11.5, maxX: -3.3, minZ: -13.1, maxZ: -5.9, floor: "tile" },
  { id: "photoNeck", name: "늘밤네컷", minX: 1.3, maxX: 4.8, minZ: 0.15, maxZ: 3.7, floor: "tile" },
  { id: "photo", name: "늘밤네컷", minX: 3.2, maxX: 10.5, minZ: -2.3, maxZ: 6.5, floor: "tile" },
  { id: "karaNeck", name: "늘밤노래", minX: 1.3, maxX: 5, minZ: -13.7, maxZ: -9.9, floor: "tile" },
  { id: "karaoke", name: "늘밤노래", minX: 3.3, maxX: 10.9, minZ: -17.1, maxZ: -8.1, floor: "tile" },
  { id: "kroom", name: "노래 2번 방", minX: 6.1, maxX: 10.7, minZ: -20.5, maxZ: -15.5, floor: "tile" },
  { id: "studyNeck", name: "북쪽 복도", minX: -1.7, maxX: 1.7, minZ: -26.3, maxZ: -20.1, floor: "vinyl" },
  { id: "study", name: "늘밤스터디", minX: -7.1, maxX: 7.1, minZ: -33.8, maxZ: -24.3, floor: "vinyl" },
  { id: "service", name: "설비 복도", minX: -1.8, maxX: 1.8, minZ: -39.2, maxZ: -32.2, floor: "concrete" },
];

export function buildWalk(rects: Rect[] = RECTS): Set<string> {
  const walk = new Set<string>();
  for (const r of rects) {
    const i0 = Math.floor(r.minX / CELL);
    const i1 = Math.floor((r.maxX - 0.001) / CELL);
    const k0 = Math.floor(r.minZ / CELL);
    const k1 = Math.floor((r.maxZ - 0.001) / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let k = k0; k <= k1; k++) {
        const cx = (i + 0.5) * CELL;
        const cz = (k + 0.5) * CELL;
        if (cx >= r.minX && cx <= r.maxX && cz >= r.minZ && cz <= r.maxZ) walk.add(i + "," + k);
      }
    }
  }
  return walk;
}

export function placeAt(x: number, z: number): string {
  let best = "주통로";
  let area = Infinity;
  for (const r of RECTS) {
    if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
    const a = (r.maxX - r.minX) * (r.maxZ - r.minZ);
    if (a < area) {
      area = a;
      best = r.name;
    }
  }
  return best;
}

export function isFree(x: number, z: number, walk: Set<string>, blocks: AABB[], radius = 0.29): boolean {
  const r = radius;
  const diag = r * 0.72;
  const offs = [
    [0, 0],
    [r, 0],
    [-r, 0],
    [0, r],
    [0, -r],
    [diag, diag],
    [diag, -diag],
    [-diag, diag],
    [-diag, -diag],
  ];
  for (const [dx, dz] of offs) {
    const px = x + dx!;
    const pz = z + dz!;
    if (!walk.has(Math.floor(px / CELL) + "," + Math.floor(pz / CELL))) return false;
    for (const b of blocks) {
      if (px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) return false;
    }
  }
  return true;
}

export function floorAt(x: number, z: number): FloorKind {
  let kind: FloorKind = "tile";
  let pri = 0;
  const rank: Record<FloorKind, number> = { tile: 1, vinyl: 2, concrete: 3 };
  for (const r of RECTS) {
    if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
    if (rank[r.floor] > pri) {
      pri = rank[r.floor];
      kind = r.floor;
    }
  }
  return kind;
}
