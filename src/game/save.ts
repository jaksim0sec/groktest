export type Ending = "name" | "1842" | "blank";

export type SaveData = {
  v: 1;
  found: string[];
  ending: Ending | null;
  playerName: string;
  serviceOpen: boolean;
  sens: number;
};

const KEY = "neulbam-b2-v1";

export const EMPTY_SAVE: SaveData = {
  v: 1,
  found: [],
  ending: null,
  playerName: "",
  serviceOpen: false,
  sens: 1,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_SAVE, found: [] };
    const p = JSON.parse(raw) as Partial<SaveData>;
    if (p.v !== 1 || !Array.isArray(p.found)) return { ...EMPTY_SAVE, found: [] };
    return {
      v: 1,
      found: p.found.filter((x) => typeof x === "string"),
      ending: p.ending === "name" || p.ending === "1842" || p.ending === "blank" ? p.ending : null,
      playerName: typeof p.playerName === "string" ? p.playerName.slice(0, 12) : "",
      serviceOpen: Boolean(p.serviceOpen),
      sens: typeof p.sens === "number" && p.sens > 0.4 && p.sens < 2 ? p.sens : 1,
    };
  } catch {
    return { ...EMPTY_SAVE, found: [] };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
