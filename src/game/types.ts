import type { Ending } from "./save";

export type SheetView = {
  id: string;
  title: string;
  place: string;
  chapter: string;
  paragraphs: string[];
  terminal?: boolean;
};

export type GameApi = {
  begin: () => void;
  interact: () => void;
  closeOverlay: () => void;
  openLog: () => void;
  reread: (id: string) => void;
  choose: (kind: Ending, name: string) => void;
  reset: () => void;
  setLook: (dx: number, dy: number) => void;
  setStick: (x: number, y: number, active: boolean) => void;
  setSens: (n: number) => void;
};

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  getPos: () => { x: number; z: number };
  setKeys: (codes: string[]) => void;
  teleport: (x: number, z: number, yaw?: number) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}
