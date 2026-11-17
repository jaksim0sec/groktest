import { create } from "zustand";
import type { GameApi, SheetView } from "./types";

export type GameState = {
  ready: boolean;
  error: string | null;
  playing: boolean;
  place: string;
  clock: string;
  prompt: string | null;
  hint: string;
  sheet: SheetView | null;
  log: boolean;
  found: string[];
  ending: string | null;
  sens: number;
  toast: string | null;
};

export const useGame = create<GameState>(() => ({
  ready: false,
  error: null,
  playing: false,
  place: "주통로",
  clock: "03:58",
  prompt: null,
  hint: "방재실의 인수인계",
  sheet: null,
  log: false,
  found: [],
  ending: null,
  sens: 1,
  toast: null,
}));

export const gameApi: { current: GameApi | null } = { current: null };
