import * as THREE from "three";
import { Ambience } from "./audio";
import {
  BADGE_LOCKED,
  CORE,
  DOOR_LOCKED,
  DOOR_WAIT,
  ENTRIES,
  HINTS,
  SPOTS,
  TERMINAL_BODY,
  chapterTitle,
  nameEndingBody,
} from "./content";
import { buildWorld, type World } from "./buildWorld";
import { isFree, placeAt } from "./layout";
import { drawB2, drawCams } from "./monitor";
import { clearSave, loadSave, writeSave, type Ending, type SaveData } from "./save";
import { gameApi, useGame } from "./store";
import { ensureFont } from "./textures";
import type { GameApi, SheetView } from "./types";

const EYE = 1.58;
const WALK = 2.35;

export class Game implements GameApi {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private world!: World;
  private audio = new Ambience();
  private keys = new Set<string>();
  private override: Set<string> | null = null;
  private alive = true;
  private raf = 0;
  private last = 0;
  private t = 0;
  private x = 0;
  private z = 12.2;
  private yaw = 0;
  private pitch = -0.05;
  private lookX = 0;
  private lookY = 0;
  private stickX = 0;
  private stickY = 0;
  private stickActive = false;
  private sens = 1;
  private userLook = false;
  private found = new Set<string>();
  private ending: Ending | null = null;
  private playerName = "";
  private serviceOpen = false;
  private leftPhoto = false;
  private minutes = 3 * 60 + 58;
  private speed = 0;
  private bodies = new Map<string, string[]>();
  private toastUntil = 0;
  private monitorAt = 0;
  private prevE = false;
  private reduce = false;
  private ring!: THREE.Mesh;
  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onBlur = () => this.keys.clear();
  private onVis = () => {
    if (document.hidden) this.keys.clear();
    else this.audio.resume();
  };

  constructor(private canvas: HTMLCanvasElement) {}

  async start() {
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = loadSave();
    this.found = new Set(save.found);
    this.ending = save.ending;
    this.playerName = save.playerName;
    this.serviceOpen = save.serviceOpen || Boolean(save.ending);
    this.sens = save.sens;
    if (this.ending === "name" && this.playerName) this.bodies.set("end-name", nameEndingBody(this.playerName));
    if (this.found.has("photostrip") && !this.found.has("booth-return")) this.leftPhoto = true;
    useGame.setState({
      found: [...this.found],
      ending: this.ending,
      sens: this.sens,
      hint: this.hint(),
    });
    await ensureFont();
    if (!this.alive) return;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      });
    } catch (err) {
      useGame.setState({ error: "이 기기에서는 3D를 열 수 없습니다.", ready: false });
      console.error(err);
      return;
    }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.setClearColor(0xc2bbb0);
    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.world = buildWorld(aniso);
    this.applyPersistent();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.08, 80);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.28, 24),
      new THREE.MeshBasicMaterial({ color: 0x8fd0c4, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.03;
    this.world.scene.add(this.ring);
    this.resize();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.canvas);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVis);
    gameApi.current = this;
    window.__controlsTest = {
      getYaw: () => this.yaw,
      getSpeed: () => this.speed,
      getPos: () => ({ x: this.x, z: this.z }),
      setKeys: (codes) => {
        this.override = new Set(codes);
      },
      teleport: (x, z, yaw) => {
        this.x = x;
        this.z = z;
        if (yaw !== undefined) this.yaw = yaw;
        this.userLook = true;
      },
    };
    useGame.setState({ ready: true, error: null });
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.alive) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  begin() {
    if (useGame.getState().playing) return;
    useGame.setState({ playing: true });
    this.audio.start();
    this.refreshHint();
  }

  setLook(dx: number, dy: number) {
    if (dx || dy) this.userLook = true;
    this.lookX += dx;
    this.lookY += dy;
  }

  setStick(x: number, y: number, active: boolean) {
    this.stickX = x;
    this.stickY = y;
    this.stickActive = active;
  }

  setSens(n: number) {
    this.sens = Math.min(1.8, Math.max(0.55, n));
    useGame.setState({ sens: this.sens });
    this.persist();
  }

  closeOverlay() {
    useGame.setState({ sheet: null, log: false });
  }

  openLog() {
    useGame.setState({ log: true, sheet: null });
  }

  reread(id: string) {
    if (id === "terminal") {
      this.showSheet(this.terminalSheet());
      return;
    }
    this.showSheet(this.sheetFor(id));
  }

  interact() {
    const ui = useGame.getState();
    if (!ui.playing) return;
    if (ui.sheet || ui.log) {
      this.closeOverlay();
      return;
    }
    const spot = this.nearest();
    if (!spot) return;
    this.audio.beep();
    if (spot.id === "badge" && !this.found.has("drawer-key")) {
      this.showSheet({
        id: "badge-locked",
        title: "잠긴 캐비닛",
        place: "늘밤세탁",
        chapter: "번호",
        paragraphs: BADGE_LOCKED,
      });
      return;
    }
    if (spot.id === "door") {
      this.showSheet({
        id: "door",
        title: "설비문",
        place: "북쪽 복도",
        chapter: "동선",
        paragraphs: this.hasCore() ? DOOR_WAIT : DOOR_LOCKED,
      });
      return;
    }
    if (spot.id === "terminal") {
      if (this.ending) this.showSheet(this.sheetFor(this.endingId()));
      else this.showSheet(this.terminalSheet());
      return;
    }
    if (spot.id === "cctv") {
      const ghost = this.ghostOn();
      if (this.hasCore() && !this.serviceOpen) {
        this.serviceOpen = true;
        this.openDoor(true);
        this.collect(ghost ? "cctv-ghost" : "cctv");
        this.collect("service-open");
        this.audio.chime();
        this.toast("북쪽 설비문이 열렸다.");
        this.showSheet(this.sheetFor("service-open"));
        return;
      }
      const id = ghost ? "cctv-ghost" : "cctv";
      this.collect(id);
      this.showSheet(this.sheetFor(id));
      return;
    }
    if (spot.id === "pharmacy") {
      const id = this.ending ? "pharmacy-on" : "pharmacy-off";
      this.collect(id);
      this.showSheet(this.sheetFor(id));
      return;
    }
    this.collect(spot.id);
    this.showSheet(this.sheetFor(spot.id));
  }

  choose(kind: Ending, name: string) {
    if (this.ending) {
      this.showSheet(this.sheetFor(this.endingId()));
      return;
    }
    const clean = (name || "당직").trim().slice(0, 12) || "당직";
    this.playerName = clean;
    this.ending = kind;
    if (kind === "name") this.bodies.set("end-name", nameEndingBody(clean));
    this.collect(this.endingId());
    this.applyEndingVisual();
    this.audio.chime();
    this.toast(kind === "1842" ? "라디오: 1842, 마감 확인." : kind === "blank" ? "출구 안내가 끊겼다." : "서쪽 셔터에 불이 들어왔다.");
    this.showSheet(this.sheetFor(this.endingId()));
    this.refreshHint();
  }

  reset() {
    clearSave();
    location.reload();
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVis);
    if (gameApi.current === this) gameApi.current = null;
    if (window.__controlsTest) delete window.__controlsTest;
    this.audio.dispose();
    this.world?.dispose();
    this.renderer?.dispose();
  }

  private frame(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000 || 0);
    this.last = now;
    this.t += dt;
    const ui = useGame.getState();
    const paused = Boolean(ui.sheet || ui.log || !ui.playing);

    this.yaw -= this.lookX * 0.0052 * this.sens;
    this.pitch -= this.lookY * 0.0044 * this.sens;
    this.lookX = 0;
    this.lookY = 0;
    this.pitch = Math.max(-1.02, Math.min(0.95, this.pitch));

    if (!ui.playing && !this.userLook && !this.reduce) this.yaw = Math.sin(this.t * 0.15) * 0.22;

    const held = this.override ?? this.keys;
    const eDown = held.has("KeyE");
    if (eDown && !this.prevE && ui.playing) this.interact();
    this.prevE = eDown;

    let ix = 0;
    let iz = 0;
    if (!paused) {
      if (held.has("KeyW") || held.has("ArrowUp")) iz += 1;
      if (held.has("KeyS") || held.has("ArrowDown")) iz -= 1;
      if (held.has("KeyD") || held.has("ArrowRight")) ix += 1;
      if (held.has("KeyA") || held.has("ArrowLeft")) ix -= 1;
      if (this.stickActive) {
        ix += this.stickX;
        iz += this.stickY;
      } else this.readPad(dt, (x, z) => {
        ix += x;
        iz += z;
      });
      const mag = Math.hypot(ix, iz);
      if (mag > 1) {
        ix /= mag;
        iz /= mag;
      }
      const ox = this.x;
      const oz = this.z;
      let left = dt;
      while (left > 0.0001) {
        const h = Math.min(left, 1 / 60);
        this.step(h, ix, iz);
        left -= h;
      }
      this.speed = dt > 0 ? Math.hypot(this.x - ox, this.z - oz) / dt : 0;
      this.audio.update(dt, this.speed);
      this.minutes += dt / 4;
      this.clockEvents();
    } else this.speed = 0;

    if (!this.reduce && ui.playing) {
      const target = this.world.flicker.userData.base ?? this.world.flicker.intensity;
      if (!this.world.flicker.userData.base) this.world.flicker.userData.base = this.world.flicker.intensity || 28;
      const n = Math.sin(this.t * 17) + Math.sin(this.t * 43);
      this.world.flicker.intensity = (this.world.flicker.userData.base as number) * (n > 1.3 ? 0.35 : 1);
      void target;
    }

    if (this.serviceOpen && this.world.door.position.y < 3.75) {
      this.world.door.position.y += (3.8 - this.world.door.position.y) * Math.min(1, dt * 2.4);
    }

    this.trackGhost();
    const place = placeAt(this.x, this.z);
    const clock = this.clockText();
    const spot = ui.playing && !ui.sheet && !ui.log ? this.nearest() : null;
    const prompt = spot?.label ?? null;
    if (place !== ui.place || clock !== ui.clock || prompt !== ui.prompt) {
      useGame.setState({ place, clock, prompt });
    }
    if (this.toastUntil && now > this.toastUntil && ui.toast) {
      this.toastUntil = 0;
      useGame.setState({ toast: null });
    }

    this.monitorAt -= dt;
    if (this.monitorAt <= 0) {
      this.monitorAt = 0.25;
      drawCams(this.world.cams.ctx, this.x, this.z, this.ghostOn());
      this.world.cams.tex.needsUpdate = true;
      drawB2(this.world.b2.ctx, this.hasCore(), this.serviceOpen);
      this.world.b2.tex.needsUpdate = true;
      const cg = this.world.clock.ctx;
      cg.fillStyle = "#10210f";
      cg.fillRect(0, 0, cg.canvas.width, cg.canvas.height);
      cg.fillStyle = "#d9ffd0";
      cg.font = '700 120px "Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';
      cg.textAlign = "center";
      cg.textBaseline = "middle";
      cg.fillText(clock, cg.canvas.width / 2, cg.canvas.height / 2);
      cg.textAlign = "left";
      this.world.clock.tex.needsUpdate = true;
    }

    const bob = !this.reduce && this.speed > 0.2 ? Math.sin(this.t * 9.2) * 0.012 : 0;
    this.camera.position.set(this.x, EYE + bob, this.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    if (spot && ui.playing) {
      this.ring.visible = true;
      this.ring.position.x = spot.x;
      this.ring.position.z = spot.z;
      const s = 1 + Math.sin(this.t * 4) * 0.06;
      this.ring.scale.set(s, s, s);
    } else this.ring.visible = false;

    this.renderer.render(this.world.scene, this.camera);
  }

  private step(h: number, ix: number, iz: number) {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    const vx = (fx * iz + rx * ix) * WALK * h;
    const vz = (fz * iz + rz * ix) * WALK * h;
    const nx = this.x + vx;
    const nz = this.z + vz;
    if (isFree(nx, nz, this.world.walk, this.world.blocks)) {
      this.x = nx;
      this.z = nz;
      return;
    }
    if (isFree(nx, this.z, this.world.walk, this.world.blocks)) this.x = nx;
    else if (isFree(this.x, nz, this.world.walk, this.world.blocks)) this.z = nz;
  }

  private readPad(dt: number, add: (x: number, z: number) => void) {
    const pads = navigator.getGamepads?.();
    const gp = pads?.[0];
    if (!gp) return;
    const dz = 0.18;
    let x = gp.axes[0] ?? 0;
    let y = gp.axes[1] ?? 0;
    const m = Math.hypot(x, y);
    if (m > dz) {
      const s = (m - dz) / (1 - dz) / m;
      add(x * s, -y * s);
    }
    const lx = gp.axes[2] ?? 0;
    const ly = gp.axes[3] ?? 0;
    if (Math.hypot(lx, ly) > 0.22) {
      this.yaw -= lx * dt * 1.7;
      this.pitch -= ly * dt * 1.25;
      this.userLook = true;
    }
    void x;
  }

  private nearest() {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    let best: (typeof SPOTS)[number] | null = null;
    let bestD = Infinity;
    for (const spot of SPOTS) {
      if (spot.id === "door" && this.serviceOpen) continue;
      if (spot.id === "terminal" && !this.serviceOpen) continue;
      const dx = spot.x - this.x;
      const dz = spot.z - this.z;
      const d = Math.hypot(dx, dz);
      const range = spot.range ?? 1.65;
      if (d > range || d > bestD) continue;
      if (d > 0.75) {
        const f = (dx * fx + dz * fz) / d;
        if (f < 0.2) continue;
      }
      best = spot;
      bestD = d;
    }
    if (!best) return null;
    if (best.id === "badge" && !this.found.has("drawer-key")) return { ...best, label: "잠긴 캐비닛" };
    if (best.id === "terminal" && this.ending) return { ...best, label: "저장된 단말" };
    if (best.id === "pharmacy" && this.ending) return { ...best, label: "켜진 약국" };
    return best;
  }

  private hasCore() {
    return CORE.every((id) => this.found.has(id));
  }

  private ghostOn() {
    return this.found.has("photostrip") && !this.found.has("booth-return") && this.leftPhoto;
  }

  private trackGhost() {
    if (!this.found.has("photostrip") || this.found.has("booth-return")) return;
    const inPhoto = placeAt(this.x, this.z) === "늘밤네컷";
    if (!inPhoto) this.leftPhoto = true;
    else if (this.leftPhoto) {
      this.collect("booth-return");
      this.toast("부스는 비어 있다.");
    }
  }

  private clockEvents() {
    if (this.found.has("laundry-ticket") && !this.found.has("laundry-late") && this.minutes >= 4 * 60 + 40) {
      this.collect("laundry-late");
      this.toast("04:40이 지났다. 통은 아직 돈다.");
    }
    if (!this.found.has("first-train") && this.minutes >= 5 * 60 && useGame.getState().playing) {
      this.collect("first-train");
      this.toast("05:00. 남쪽 셔터는 그대로다.");
    }
  }

  private clockText() {
    const m = Math.floor(this.minutes);
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  private hint() {
    if (this.ending === "blank") return "출구 번호가 꺼졌다";
    if (this.ending) return "서쪽 셔터를 다시 본다";
    if (!this.found.has("handover")) return HINTS.handover!;
    const next = CORE.find((id) => !this.found.has(id));
    if (next) return HINTS[next]!;
    if (!this.serviceOpen) return HINTS.cctv!;
    return HINTS.terminal!;
  }

  private refreshHint() {
    useGame.setState({ hint: this.hint() });
  }

  private collect(id: string) {
    if (this.found.has(id)) return;
    this.found.add(id);
    const mesh = this.world.pickups.get(id);
    if (mesh) mesh.visible = false;
    if (id === "laundry-ticket" && this.minutes >= 4 * 60 + 40) this.collect("laundry-late");
    useGame.setState({ found: [...this.found], ending: this.ending });
    this.refreshHint();
    this.persist();
  }

  private endingId() {
    return this.ending === "name" ? "end-name" : this.ending === "1842" ? "end-1842" : "end-blank";
  }

  private sheetFor(id: string): SheetView {
    const e = ENTRIES[id];
    if (!e) {
      return { id, title: "기록", place: "", chapter: "", paragraphs: [] };
    }
    return {
      id,
      title: e.title,
      place: e.place,
      chapter: chapterTitle(e.chapter),
      paragraphs: this.bodies.get(id) ?? e.body,
    };
  }

  private terminalSheet(): SheetView {
    return {
      id: "terminal",
      title: "이름 칸",
      place: "설비 복도",
      chapter: "인수인계",
      paragraphs: TERMINAL_BODY,
      terminal: true,
    };
  }

  private showSheet(sheet: SheetView) {
    useGame.setState({ sheet, log: false });
  }

  private toast(msg: string) {
    this.toastUntil = performance.now() + 3600;
    useGame.setState({ toast: msg });
  }

  private openDoor(anim: boolean) {
    const i = this.world.blocks.findIndex((b) => b.tag === "door");
    if (i >= 0) this.world.blocks.splice(i, 1);
    if (!anim) this.world.door.position.y = 3.8;
  }

  private applyEndingVisual() {
    this.world.pharmacyMat.color.set("#e9fff8");
    this.world.pharmacyMat.emissive.set("#9affe4");
    this.world.pharmacyMat.emissiveIntensity = 1.05;
    this.world.pharmacyLight.intensity = 5.5;
    if (this.ending === "blank") {
      this.world.exitMat.emissiveIntensity = 0;
      this.world.exitMat.color.set("#3c3c3c");
      this.world.exitMat.emissive.set("#000000");
    }
  }

  private applyPersistent() {
    for (const id of this.found) {
      const mesh = this.world.pickups.get(id);
      if (mesh) mesh.visible = false;
    }
    if (this.serviceOpen) this.openDoor(false);
    if (this.ending) this.applyEndingVisual();
  }

  private persist() {
    const data: SaveData = {
      v: 1,
      found: [...this.found],
      ending: this.ending,
      playerName: this.playerName,
      serviceOpen: this.serviceOpen,
      sens: this.sens,
    };
    writeSave(data);
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 520 ? 1.35 : 1.6);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    if (aspect >= 1) this.camera.fov = 68;
    else {
      const hf = (74 * Math.PI) / 180;
      const vf = 2 * Math.atan(Math.tan(hf / 2) / Math.max(aspect, 0.34));
      this.camera.fov = Math.min(104, (vf * 180) / Math.PI);
    }
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
