import { a as CORE, c as ENTRIES, d as TERMINAL_BODY, f as chapterTitle, i as BADGE_LOCKED, l as HINTS, n as gameApi, o as DOOR_LOCKED, p as nameEndingBody, r as useGame, s as DOOR_WAIT, u as SPOTS } from "./routes-BC9THg2y.mjs";
import { S as TextureLoader, _ as PointLight, a as CanvasTexture, b as SRGBColorSpace, c as Color, d as HemisphereLight, f as Mesh, g as PlaneGeometry, h as PerspectiveCamera, i as BoxGeometry, l as CylinderGeometry, m as MeshStandardMaterial, n as WebGLRenderer, o as CircleGeometry, p as MeshBasicMaterial, r as AmbientLight, s as ClampToEdgeWrapping, t as mergeGeometries, u as FogExp2, v as RepeatWrapping, x as Scene, y as RingGeometry } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-FRg7emDw.js
var Ambience = class {
	ctx = null;
	hum = null;
	stepAt = 0;
	noise = null;
	start() {
		if (this.ctx) {
			this.ctx.resume();
			return;
		}
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		const ctx = new AC();
		this.ctx = ctx;
		const hum = ctx.createGain();
		hum.gain.value = .018;
		hum.connect(ctx.destination);
		this.hum = hum;
		const o1 = ctx.createOscillator();
		o1.type = "sine";
		o1.frequency.value = 60;
		const o2 = ctx.createOscillator();
		o2.type = "sine";
		o2.frequency.value = 120;
		o2.connect(hum);
		o1.connect(hum);
		o1.start();
		o2.start();
		const len = Math.floor(ctx.sampleRate * .045);
		const buf = ctx.createBuffer(1, len, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
		this.noise = buf;
		ctx.resume();
	}
	resume() {
		if (this.ctx?.state === "suspended") this.ctx.resume();
	}
	update(dt, speed) {
		if (!this.ctx || !this.noise || speed < .35) return;
		this.stepAt -= dt;
		const interval = .46 - Math.min(.18, speed * .05);
		if (this.stepAt > 0) return;
		this.stepAt = interval;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noise;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.value = 280;
		filter.Q.value = .7;
		const g = this.ctx.createGain();
		g.gain.value = .08;
		src.connect(filter);
		filter.connect(g);
		g.connect(this.ctx.destination);
		src.start();
	}
	beep() {
		this.tone(880, .06, .04);
	}
	chime() {
		this.tone(523, .18, .05);
		window.setTimeout(() => this.tone(784, .22, .04), 160);
	}
	tone(freq, dur, gain) {
		if (!this.ctx) return;
		const o = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		o.frequency.value = freq;
		o.type = "sine";
		g.gain.value = gain;
		o.connect(g);
		g.connect(this.ctx.destination);
		o.start();
		g.gain.exponentialRampToValueAtTime(1e-4, this.ctx.currentTime + dur);
		o.stop(this.ctx.currentTime + dur);
	}
	dispose() {
		this.ctx?.close();
		this.ctx = null;
	}
};
var CELL = .5;
/** Walkable floor plan. Overlaps of ≥1m are doors. */
var RECTS = [
	{
		id: "main",
		name: "주통로",
		minX: -2.3,
		maxX: 2.3,
		minZ: -22,
		maxZ: 16,
		floor: "tile"
	},
	{
		id: "secNeck",
		name: "방재실",
		minX: 1.4,
		maxX: 4.6,
		minZ: 11.2,
		maxZ: 13.5,
		floor: "tile"
	},
	{
		id: "security",
		name: "방재실",
		minX: 3.2,
		maxX: 8.4,
		minZ: 10,
		maxZ: 15.5,
		floor: "tile"
	},
	{
		id: "stairNeck",
		name: "출구 4",
		minX: -4.8,
		maxX: -1.3,
		minZ: 11,
		maxZ: 13.5,
		floor: "tile"
	},
	{
		id: "stairs",
		name: "출구 4",
		minX: -8.8,
		maxX: -3.3,
		minZ: 10.1,
		maxZ: 15.7,
		floor: "tile"
	},
	{
		id: "iceNeck",
		name: "늘밤아이스",
		minX: -5,
		maxX: -1.3,
		minZ: .3,
		maxZ: 3.7,
		floor: "tile"
	},
	{
		id: "ice",
		name: "늘밤아이스",
		minX: -11.1,
		maxX: -3.3,
		minZ: -1.9,
		maxZ: 6.1,
		floor: "tile"
	},
	{
		id: "lauNeck",
		name: "늘밤세탁",
		minX: -5,
		maxX: -1.3,
		minZ: -10.5,
		maxZ: -7.1,
		floor: "tile"
	},
	{
		id: "laundry",
		name: "늘밤세탁",
		minX: -11.5,
		maxX: -3.3,
		minZ: -13.1,
		maxZ: -5.9,
		floor: "tile"
	},
	{
		id: "photoNeck",
		name: "늘밤네컷",
		minX: 1.3,
		maxX: 4.8,
		minZ: .15,
		maxZ: 3.7,
		floor: "tile"
	},
	{
		id: "photo",
		name: "늘밤네컷",
		minX: 3.2,
		maxX: 10.5,
		minZ: -2.3,
		maxZ: 6.5,
		floor: "tile"
	},
	{
		id: "karaNeck",
		name: "늘밤노래",
		minX: 1.3,
		maxX: 5,
		minZ: -13.7,
		maxZ: -9.9,
		floor: "tile"
	},
	{
		id: "karaoke",
		name: "늘밤노래",
		minX: 3.3,
		maxX: 10.9,
		minZ: -17.1,
		maxZ: -8.1,
		floor: "tile"
	},
	{
		id: "kroom",
		name: "노래 2번 방",
		minX: 6.1,
		maxX: 10.7,
		minZ: -20.5,
		maxZ: -15.5,
		floor: "tile"
	},
	{
		id: "studyNeck",
		name: "북쪽 복도",
		minX: -1.7,
		maxX: 1.7,
		minZ: -26.3,
		maxZ: -20.1,
		floor: "vinyl"
	},
	{
		id: "study",
		name: "늘밤스터디",
		minX: -7.1,
		maxX: 7.1,
		minZ: -33.8,
		maxZ: -24.3,
		floor: "vinyl"
	},
	{
		id: "service",
		name: "설비 복도",
		minX: -1.8,
		maxX: 1.8,
		minZ: -39.2,
		maxZ: -32.2,
		floor: "concrete"
	}
];
function buildWalk(rects = RECTS) {
	const walk = /* @__PURE__ */ new Set();
	for (const r of rects) {
		const i0 = Math.floor(r.minX / CELL);
		const i1 = Math.floor((r.maxX - .001) / CELL);
		const k0 = Math.floor(r.minZ / CELL);
		const k1 = Math.floor((r.maxZ - .001) / CELL);
		for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
			const cx = (i + .5) * CELL;
			const cz = (k + .5) * CELL;
			if (cx >= r.minX && cx <= r.maxX && cz >= r.minZ && cz <= r.maxZ) walk.add(i + "," + k);
		}
	}
	return walk;
}
function placeAt(x, z) {
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
function isFree(x, z, walk, blocks, radius = .29) {
	const r = radius;
	const diag = r * .72;
	const offs = [
		[0, 0],
		[r, 0],
		[-r, 0],
		[0, r],
		[0, -r],
		[diag, diag],
		[diag, -diag],
		[-diag, diag],
		[-diag, -diag]
	];
	for (const [dx, dz] of offs) {
		const px = x + dx;
		const pz = z + dz;
		if (!walk.has(Math.floor(px / .5) + "," + Math.floor(pz / .5))) return false;
		for (const b of blocks) if (px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) return false;
	}
	return true;
}
function floorAt(x, z) {
	let kind = "tile";
	let pri = 0;
	const rank = {
		tile: 1,
		vinyl: 2,
		concrete: 3
	};
	for (const r of RECTS) {
		if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
		if (rank[r.floor] > pri) {
			pri = rank[r.floor];
			kind = r.floor;
		}
	}
	return kind;
}
var FONT$1 = "\"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
function canvasTex(c, aniso, repeat = false) {
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = aniso;
	t.wrapS = t.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
	t.needsUpdate = true;
	return t;
}
function noise(x, y) {
	const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return n - Math.floor(n);
}
function makeTextures(aniso) {
	return {
		tile: canvasTex(tileCanvas(), aniso),
		vinyl: canvasTex(vinylCanvas(), aniso),
		concrete: canvasTex(concreteCanvas(), aniso),
		runner: canvasTex(runnerCanvas(), aniso, true),
		tactile: canvasTex(tactileCanvas(), aniso, true),
		wall: canvasTex(wallCanvas(), aniso, true),
		shutter: canvasTex(shutterCanvas(), aniso, true),
		ceiling: canvasTex(ceilingCanvas(), aniso, true)
	};
}
function tileCanvas() {
	const s = 128;
	const c = document.createElement("canvas");
	c.width = c.height = s;
	const g = c.getContext("2d");
	const n = noise(2, 5);
	const base = 198 + Math.floor(n * 18);
	g.fillStyle = `rgb(${base},${base - 6},${base - 14})`;
	g.fillRect(0, 0, s, s);
	const img = g.getImageData(0, 0, s, s);
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const i = (y * s + x) * 4;
		const speck = (noise(x, y) - .5) * 16;
		img.data[i] = Math.min(255, img.data[i] + speck);
		img.data[i + 1] = Math.min(255, img.data[i + 1] + speck);
		img.data[i + 2] = Math.min(255, img.data[i + 2] + speck);
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
	const g = c.getContext("2d");
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
	const g = c.getContext("2d");
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
	const g = c.getContext("2d");
	g.fillStyle = "#7c7872";
	g.fillRect(0, 0, s, s);
	const img = g.getImageData(0, 0, s, s);
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const i = (y * s + x) * 4;
		const speck = (noise(x * .7, y * 1.3) - .5) * 28;
		img.data[i] = Math.max(0, img.data[i] + speck);
		img.data[i + 1] = Math.max(0, img.data[i + 1] + speck);
		img.data[i + 2] = Math.max(0, img.data[i + 2] + speck);
	}
	g.putImageData(img, 0, 0);
	return c;
}
function runnerCanvas() {
	const s = 128;
	const c = document.createElement("canvas");
	c.width = c.height = s;
	const g = c.getContext("2d");
	g.fillStyle = "#6d4e38";
	g.fillRect(0, 0, s, s);
	const img = g.getImageData(0, 0, s, s);
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const i = (y * s + x) * 4;
		const speck = (noise(x * 1.7, y * .4) - .5) * 40;
		img.data[i] = Math.max(0, Math.min(255, img.data[i] + speck));
		img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + speck * .7));
		img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + speck * .45));
	}
	g.putImageData(img, 0, 0);
	return c;
}
function tactileCanvas() {
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 128;
	const g = c.getContext("2d");
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
	const g = c.getContext("2d");
	for (let y = 0; y < 128; y++) {
		const v = Math.floor(y / 6) % 2 ? 92 : 122;
		g.fillStyle = `rgb(${v + 8},${v + 4},${v - 2})`;
		g.fillRect(0, y, 64, 1);
	}
	return c;
}
function ceilingCanvas() {
	const s = 128;
	const c = document.createElement("canvas");
	c.width = c.height = s;
	const g = c.getContext("2d");
	g.fillStyle = "#e7e2da";
	g.fillRect(0, 0, s, s);
	g.strokeStyle = "rgba(160,154,144,0.7)";
	g.lineWidth = 2;
	g.strokeRect(1, 1, 126, 126);
	return c;
}
function signTexture(lines, w, h, bg, aniso) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const g = c.getContext("2d");
	g.fillStyle = bg;
	g.fillRect(0, 0, w, h);
	g.fillStyle = "#8fd0c4";
	g.fillRect(28, 28, 64, 8);
	for (const line of lines) {
		g.fillStyle = line.color;
		g.font = `${line.weight ?? 700} ${line.size}px ${FONT$1}`;
		g.textBaseline = "middle";
		g.fillText(line.text, 28, line.y);
	}
	return canvasTex(c, aniso);
}
function plainLabel(text, w, h, fg, bg, size, aniso) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const g = c.getContext("2d");
	g.fillStyle = bg;
	g.fillRect(0, 0, w, h);
	g.fillStyle = fg;
	g.font = `700 ${size}px ${FONT$1}`;
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.fillText(text, w / 2, h / 2);
	return canvasTex(c, aniso);
}
async function ensureFont() {
	if (!document.fonts) return;
	try {
		await Promise.race([document.fonts.load(`700 64px ${FONT$1}`), new Promise((r) => setTimeout(r, 2200))]);
		const probe = document.createElement("canvas").getContext("2d");
		if (probe) {
			probe.font = `700 48px ${FONT$1}`;
			probe.fillText("늘밤", 0, 40);
		}
	} catch {}
}
var H = 3.05;
function buildWorld(aniso) {
	const scene = new Scene();
	scene.background = new Color(12762032);
	scene.fog = new FogExp2(12762032, .028);
	scene.add(new HemisphereLight(15920870, 9274488, .78));
	scene.add(new AmbientLight(12893614, .32));
	const tex = makeTextures(aniso);
	const geos = [];
	const mats = [];
	const texs = Object.values(tex);
	const blocks = [];
	const pickups = /* @__PURE__ */ new Map();
	const keepG = (g) => {
		geos.push(g);
		return g;
	};
	const keepM = (m) => {
		mats.push(m);
		return m;
	};
	const keepT = (t) => {
		texs.push(t);
		return t;
	};
	const std = (color, rough = .7, metal = 0) => keepM(new MeshStandardMaterial({
		color,
		roughness: rough,
		metalness: metal
	}));
	const tileMat = (map, rough) => keepM(new MeshStandardMaterial({
		map,
		roughness: rough,
		metalness: .04
	}));
	const floorMats = {
		tile: tileMat(tex.tile, .48),
		vinyl: tileMat(tex.vinyl, .72),
		concrete: tileMat(tex.concrete, .92)
	};
	const ceilMat = tileMat(tex.ceiling, .9);
	const wallTexMat = (len, height) => {
		const map = tex.wall.clone();
		map.wrapS = map.wrapT = RepeatWrapping;
		map.repeat.set(Math.max(1, len / .85), Math.max(1, height / .85));
		map.colorSpace = SRGBColorSpace;
		map.anisotropy = aniso;
		keepT(map);
		return keepM(new MeshStandardMaterial({
			map,
			roughness: .9,
			metalness: 0
		}));
	};
	const shutterMat = (() => {
		const map = tex.shutter.clone();
		map.wrapS = map.wrapT = RepeatWrapping;
		map.repeat.set(1, 4);
		map.anisotropy = aniso;
		map.colorSpace = SRGBColorSpace;
		keepT(map);
		return keepM(new MeshStandardMaterial({
			map,
			roughness: .42,
			metalness: .22,
			color: "#c8c2b8"
		}));
	})();
	const pier = std("#ddd6cc", .85);
	const baseboard = std("#5e564e", .8);
	const metal = std("#8d8982", .4, .45);
	const white = std("#f3f1eb", .62);
	const wood = std("#8a6844", .72);
	const dark = std("#1c1e1c", .55, .08);
	const glass = keepM(new MeshStandardMaterial({
		color: "#c5dcec",
		roughness: .08,
		metalness: .05,
		transparent: true,
		opacity: .38
	}));
	const tubeMat = keepM(new MeshStandardMaterial({
		color: "#fff8ee",
		emissive: "#fff1d6",
		emissiveIntensity: 1.7,
		roughness: .35
	}));
	const pinkMat = keepM(new MeshStandardMaterial({
		color: "#ffd0e4",
		emissive: "#ff7eb6",
		emissiveIntensity: 1.5,
		roughness: .4
	}));
	const ledMat = keepM(new MeshStandardMaterial({
		color: "#d9ffe8",
		emissive: "#3ddc7a",
		emissiveIntensity: 1.4
	}));
	const exitMat = keepM(new MeshStandardMaterial({
		color: "#e7fff1",
		emissive: "#1f8a4c",
		emissiveIntensity: .85,
		roughness: .4
	}));
	const pharmacyMat = keepM(new MeshStandardMaterial({
		color: "#1a2420",
		emissive: "#10201c",
		emissiveIntensity: .15,
		roughness: .45
	}));
	const walk = buildWalk();
	layFloors(scene, walk, floorMats, ceilMat, keepG);
	const runnerMap = tex.runner.clone();
	runnerMap.wrapS = runnerMap.wrapT = RepeatWrapping;
	runnerMap.repeat.set(1, 28);
	runnerMap.colorSpace = SRGBColorSpace;
	runnerMap.anisotropy = aniso;
	keepT(runnerMap);
	const runner = new Mesh(keepG(new PlaneGeometry(1.05, 38)), keepM(new MeshStandardMaterial({
		map: runnerMap,
		roughness: .62
	})));
	runner.rotation.x = -Math.PI / 2;
	runner.position.set(-.42, .012, -3);
	scene.add(runner);
	const tactMap = tex.tactile.clone();
	tactMap.wrapS = tactMap.wrapT = RepeatWrapping;
	tactMap.repeat.set(1, 46);
	tactMap.colorSpace = SRGBColorSpace;
	tactMap.anisotropy = aniso;
	keepT(tactMap);
	const tact = new Mesh(keepG(new PlaneGeometry(.62, 38)), keepM(new MeshStandardMaterial({
		map: tactMap,
		roughness: .78
	})));
	tact.rotation.x = -Math.PI / 2;
	tact.position.set(.92, .018, -3);
	scene.add(tact);
	buildWalls(scene, walk, wallTexMat, baseboard, keepG);
	dressCorridor(scene, aniso, shutterMat, pier, pharmacyMat, keepG, keepM, keepT);
	const flickerLight = addLamps(scene, tubeMat, metal, keepG);
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
		cams: null
	});
	const packed = scene.userData;
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
		}
	};
}
function layFloors(scene, walk, floorMats, ceilMat, keepG) {
	const buckets = {
		tile: [],
		vinyl: [],
		concrete: []
	};
	const ceilings = [];
	for (const key of walk) {
		const [i, k] = key.split(",").map(Number);
		const cx = (i + .5) * CELL;
		const cz = (k + .5) * CELL;
		const kind = floorAt(cx, cz);
		const fg = new PlaneGeometry(CELL, CELL);
		fg.rotateX(-Math.PI / 2);
		fg.translate(cx, 0, cz);
		buckets[kind].push(fg);
		const cg = new PlaneGeometry(CELL, CELL);
		cg.rotateX(Math.PI / 2);
		cg.translate(cx, H, cz);
		ceilings.push(cg);
	}
	Object.keys(buckets).forEach((kind) => {
		const list = buckets[kind];
		if (!list.length) return;
		const merged = mergeGeometries(list);
		list.forEach((g) => g.dispose());
		if (!merged) return;
		scene.add(new Mesh(keepG(merged), floorMats[kind]));
	});
	const ceiling = mergeGeometries(ceilings);
	ceilings.forEach((g) => g.dispose());
	if (ceiling) scene.add(new Mesh(keepG(ceiling), ceilMat));
}
function buildWalls(scene, walk, wallTexMat, base, keepG) {
	let minI = Infinity;
	let maxI = -Infinity;
	let minK = Infinity;
	let maxK = -Infinity;
	for (const key of walk) {
		const [i, k] = key.split(",").map(Number);
		minI = Math.min(minI, i);
		maxI = Math.max(maxI, i);
		minK = Math.min(minK, k);
		maxK = Math.max(maxK, k);
	}
	const thick = .14;
	const add = (x, z, sx, sz) => {
		const len = Math.max(sx, sz);
		const mesh = new Mesh(keepG(new BoxGeometry(sx, H, sz)), wallTexMat(len, H));
		mesh.position.set(x, H / 2, z);
		scene.add(mesh);
		const alongX = sx >= sz;
		const b = new Mesh(keepG(new BoxGeometry(alongX ? sx : .05, .12, alongX ? .05 : sz)), base);
		b.position.set(x, .06, z);
		scene.add(b);
	};
	const runZ = (dir) => {
		for (let i = minI; i <= maxI; i++) {
			let start = null;
			for (let k = minK; k <= maxK + 1; k++) {
				const on = k <= maxK && walk.has(i + "," + k) && !walk.has(i + dir + "," + k);
				if (on && start === null) start = k;
				if (!on && start !== null) {
					const k0 = start;
					const k1 = k - 1;
					const z0 = k0 * CELL;
					const z1 = (k1 + 1) * CELL;
					const cx = (dir === 1 ? (i + 1) * CELL : i * CELL) + dir * (thick / 2);
					add(cx, (z0 + z1) / 2, thick, z1 - z0 + thick);
					start = null;
				}
			}
		}
	};
	const runX = (dir) => {
		for (let k = minK; k <= maxK; k++) {
			let start = null;
			for (let i = minI; i <= maxI + 1; i++) {
				const on = i <= maxI && walk.has(i + "," + k) && !walk.has(i + "," + (k + dir));
				if (on && start === null) start = i;
				if (!on && start !== null) {
					const i0 = start;
					const i1 = i - 1;
					const x0 = i0 * CELL;
					const x1 = (i1 + 1) * CELL;
					const cz = (dir === 1 ? (k + 1) * CELL : k * CELL) + dir * (thick / 2);
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
function dressCorridor(scene, aniso, shutterMat, pier, pharmacyMat, keepG, keepM, keepT) {
	const westOpen = [
		[
			11,
			13.5,
			"출구 4"
		],
		[
			.3,
			3.7,
			"늘밤아이스"
		],
		[
			-10.5,
			-7.1,
			"늘밤세탁"
		]
	];
	const eastOpen = [
		[
			11.2,
			13.5,
			"방재실"
		],
		[
			.15,
			3.7,
			"늘밤네컷"
		],
		[
			-13.7,
			-9.9,
			"늘밤노래"
		]
	];
	const closedName = (z, side) => {
		if (side === "w") {
			if (z > 6 && z < 10) return "양말할인";
			if (z > 4 && z < 6.2) return "네일";
			if (z > -2.2 && z < .1) return "열쇠";
			if (z > -17 && z < -14) return "휴대폰";
			return "";
		}
		if (z > 5 && z < 10) return "교복수선";
		if (z > -8 && z < -4.2) return "분식";
		if (z > -20 && z < -16) return "구두";
		return "";
	};
	const used = /* @__PURE__ */ new Set();
	const bay = (side, z0, z1) => {
		const opens = side === "w" ? westOpen : eastOpen;
		const mid = (z0 + z1) / 2;
		const xFace = side === "w" ? -2.3 : 2.3;
		const inward = side === "w" ? 1 : -1;
		const open = opens.find(([a, b]) => mid > a && mid < b);
		if (open) {
			const t = signTexture([{
				text: "늘밤",
				size: 28,
				color: "#8fd0c4",
				y: 48,
				weight: 700
			}, {
				text: open[2],
				size: 54,
				color: "#f4efe6",
				y: 120
			}], 512, 180, "#161a18", aniso);
			keepT(t);
			const sign = new Mesh(keepG(new PlaneGeometry(1.55, .48)), keepM(new MeshStandardMaterial({
				map: t,
				roughness: .6
			})));
			sign.position.set(xFace + inward * .04, 2.55, mid);
			sign.rotation.y = side === "w" ? Math.PI / 2 : -Math.PI / 2;
			scene.add(sign);
			return;
		}
		const len = z1 - z0 - .22;
		const shut = new Mesh(keepG(new BoxGeometry(.07, 2.7, Math.max(.4, len))), shutterMat);
		shut.position.set(xFace - inward * .04, 1.35, mid);
		scene.add(shut);
		const p = new Mesh(keepG(new BoxGeometry(.18, H, .16)), pier);
		p.position.set(xFace + inward * .06, H / 2, z0);
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
			const sign = new Mesh(keepG(new PlaneGeometry(1.35, .38)), keepM(new MeshStandardMaterial({
				map: t,
				roughness: .55,
				color: "#9fd9cf"
			})));
			sign.position.set(xFace + inward * .06, 2.35, mid);
			sign.rotation.y = Math.PI / 2;
			scene.add(sign);
			const cross = new Mesh(keepG(new BoxGeometry(.05, .58, .16)), pharmacyMat);
			const bar = new Mesh(keepG(new BoxGeometry(.05, .16, .52)), pharmacyMat);
			cross.position.set(xFace + inward * .08, 1.7, mid);
			bar.position.set(xFace + inward * .08, 1.7, mid);
			scene.add(cross, bar);
			return;
		}
		const t = plainLabel(label, 512, 140, "#6d675f", "#d9d3c8", 60, aniso);
		keepT(t);
		const sign = new Mesh(keepG(new PlaneGeometry(1.3, .34)), keepM(new MeshStandardMaterial({
			map: t,
			roughness: .85
		})));
		sign.position.set(xFace + inward * .05, 2.25, mid);
		sign.rotation.y = side === "w" ? Math.PI / 2 : -Math.PI / 2;
		scene.add(sign);
	};
	for (let z = -21; z < 15.2; z += 2.05) bay("w", z, z + 2.05);
	for (let z = -21; z < 15.2; z += 2.05) bay("e", z, z + 2.05);
	const north = signTexture([{
		text: "늘밤",
		size: 26,
		color: "#8fd0c4",
		y: 42
	}, {
		text: "스터디",
		size: 58,
		color: "#f4efe6",
		y: 110
	}], 512, 180, "#161a18", aniso);
	keepT(north);
	const nsign = new Mesh(keepG(new PlaneGeometry(1.6, .5)), keepM(new MeshStandardMaterial({
		map: north,
		roughness: .55
	})));
	nsign.position.set(0, 2.5, -21.35);
	scene.add(nsign);
	const dir = document.createElement("canvas");
	dir.width = 1280;
	dir.height = 560;
	const g = dir.getContext("2d");
	g.fillStyle = "#14181c";
	g.fillRect(0, 0, 1280, 560);
	g.fillStyle = "#8fd0c4";
	g.fillRect(56, 44, 120, 10);
	g.font = "700 78px \"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
	g.fillStyle = "#f4efe6";
	g.fillText("서림역 지하상가", 56, 150);
	g.font = "500 58px \"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
	g.fillText("←  출구 4", 56, 270);
	g.fillText("↑  스터디", 56, 370);
	g.fillText("→  방재실", 640, 270);
	g.fillText("↓  개찰 폐쇄", 640, 370);
	g.fillStyle = "#1c2826";
	g.fillRect(860, 430, 360, 90);
	g.fillStyle = "#8fd0c4";
	g.font = "700 48px \"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
	g.fillText("필름  7", 900, 490);
	const dtex = new CanvasTexture(dir);
	dtex.colorSpace = SRGBColorSpace;
	dtex.anisotropy = aniso;
	keepT(dtex);
	const hang = new Mesh(keepG(new PlaneGeometry(3.05, 1.32)), keepM(new MeshStandardMaterial({
		map: dtex,
		roughness: .7,
		side: 2
	})));
	hang.position.set(0, 2.22, 7.6);
	scene.add(hang);
	const rod = new Mesh(keepG(new CylinderGeometry(.02, .02, .28)), pier);
	rod.position.set(-1.05, 2.92, 7.6);
	const rod2 = rod.clone();
	rod2.position.x = 1.05;
	scene.add(rod, rod2);
	return 0;
}
function addLamps(scene, tubeMat, metal, keepG) {
	const spots = [
		[
			0,
			12.2,
			16774114,
			36
		],
		[
			0,
			4.2,
			16774114,
			34
		],
		[
			0,
			-4.2,
			16774114,
			28
		],
		[
			0,
			-12.5,
			16774114,
			32
		],
		[
			0,
			-20,
			16774114,
			30
		],
		[
			-7.2,
			2.2,
			14150911,
			26
		],
		[
			-7.4,
			-9.4,
			13227775,
			24
		],
		[
			6.8,
			2.2,
			16762078,
			22
		],
		[
			7,
			-12.4,
			16765148,
			20
		],
		[
			0,
			-28.5,
			16769208,
			26
		],
		[
			5.6,
			12.6,
			15204324,
			18
		],
		[
			-6,
			12.4,
			16774888,
			16
		],
		[
			0,
			-35.5,
			16773324,
			12
		]
	];
	let flicker = null;
	for (const [x, z, color, intensity] of spots) {
		const house = new Mesh(keepG(new BoxGeometry(.36, .07, 1.15)), metal);
		house.position.set(x, 2.98, z);
		const tube = new Mesh(keepG(new BoxGeometry(.16, .03, 1.02)), tubeMat);
		tube.position.set(x, 2.93, z);
		scene.add(house, tube);
		const light = new PointLight(color, intensity, 12, 2);
		light.position.set(x, 2.65, z);
		scene.add(light);
		if (z === 4.2) flicker = light;
	}
	return flicker ?? new PointLight(16777215, 0, 1);
}
function screenOf(w, h, aniso, keepT) {
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#10140f";
	ctx.fillRect(0, 0, w, h);
	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	tex.anisotropy = aniso;
	keepT(tex);
	return {
		canvas,
		ctx,
		tex
	};
}
function addProps(scene, k) {
	const { blocks, pickups, keepG, keepM, keepT, aniso } = k;
	const box = (w, h, d, mat, x, y, z) => {
		const m = new Mesh(keepG(new BoxGeometry(w, h, d)), mat);
		m.position.set(x, y, z);
		scene.add(m);
		return m;
	};
	const block = (minX, maxX, minZ, maxZ, tag) => {
		blocks.push({
			minX,
			maxX,
			minZ,
			maxZ,
			tag
		});
	};
	box(2.3, .74, 1.45, k.wood, 6.75, .37, 12.35);
	block(5.6, 7.9, 11.62, 13.08);
	box(.9, .7, .7, k.wood, 6.7, .35, 13.95);
	block(6.25, 7.15, 13.6, 14.3);
	const cams = screenOf(1024, 512, aniso, keepT);
	const camMat = keepM(new MeshStandardMaterial({
		map: cams.tex,
		emissive: "#9bbaa4",
		emissiveIntensity: .35,
		roughness: .4
	}));
	const camMesh = new Mesh(keepG(new PlaneGeometry(1.7, .72)), camMat);
	camMesh.position.set(5.52, 1.2, 12.15);
	camMesh.rotation.y = -Math.PI / 2;
	scene.add(camMesh);
	const b2 = screenOf(512, 512, aniso, keepT);
	const b2Mat = keepM(new MeshStandardMaterial({
		map: b2.tex,
		emissive: "#9bbaa4",
		emissiveIntensity: .28,
		roughness: .45
	}));
	const b2Mesh = new Mesh(keepG(new PlaneGeometry(.42, .42)), b2Mat);
	b2Mesh.position.set(5.52, 1.18, 13);
	b2Mesh.rotation.y = -Math.PI / 2;
	scene.add(b2Mesh);
	box(.08, .5, .5, k.dark, 7.55, 1.15, 14.7);
	box(.32, .7, .28, k.std("#243044"), 7.15, .9, 14.55);
	const clock = screenOf(512, 220, aniso, keepT);
	const clockMesh = new Mesh(keepG(new PlaneGeometry(.7, .3)), keepM(new MeshStandardMaterial({
		map: clock.tex,
		emissive: "#cfe8c8",
		emissiveIntensity: .4
	})));
	clockMesh.position.set(7.9, 1.7, 11.2);
	clockMesh.rotation.y = -Math.PI / 2;
	scene.add(clockMesh);
	const book = box(.28, .04, .2, k.std("#efe6d4"), 6.45, .73, 13.95);
	pickups.set("handover", book);
	const freezer = (z, open = false) => {
		box(1.5, .86, .78, k.white, -9.85, .43, z);
		const stripe = new Mesh(keepG(new BoxGeometry(1.35, .08, .02)), keepM(new MeshStandardMaterial({
			color: "#e7fff8",
			emissive: "#7ed9c8",
			emissiveIntensity: .6
		})));
		stripe.position.set(-9.85, .62, z + .4);
		scene.add(stripe);
		const top = new Mesh(keepG(new BoxGeometry(1.28, .04, .62)), k.glass);
		top.position.set(-9.85, open ? 1.05 : .88, z + (open ? .05 : 0));
		if (open) top.rotation.x = -.9;
		scene.add(top);
		block(-10.65, -9.05, z - .42, z + .42);
	};
	freezer(.2);
	freezer(2.1, true);
	freezer(4);
	box(.62, 1.4, .5, k.dark, -6.25, .7, 4.15);
	block(-6.6, -5.9, 3.85, 4.5);
	const screen = new Mesh(keepG(new PlaneGeometry(.4, .55)), keepM(new MeshStandardMaterial({
		map: keepT(plainLabel("늘밤아이스", 256, 320, "#e7fff8", "#10211e", 42, aniso)),
		emissive: "#8fd0c4",
		emissiveIntensity: .35
	})));
	screen.position.set(-5.98, 1.05, 4.15);
	screen.rotation.y = Math.PI / 2;
	scene.add(screen);
	const receipt = new Mesh(keepG(new PlaneGeometry(.16, .22)), keepM(new MeshStandardMaterial({
		color: "#f7f1e4",
		roughness: .7
	})));
	receipt.rotation.x = -Math.PI / 2;
	receipt.rotation.z = .4;
	receipt.position.set(-7.15, .02, 1.05);
	scene.add(receipt);
	pickups.set("receipt", receipt);
	const key = new Mesh(keepG(new BoxGeometry(.08, .02, .18)), k.metal);
	key.position.set(-7.55, .9, 4.55);
	scene.add(key);
	pickups.set("drawer-key", key);
	for (const x of [
		-10.3,
		-8.9,
		-7.5,
		-6.1
	]) {
		box(1.05, 1.12, .7, k.white, x, .62, -12.35);
		const door = new Mesh(keepG(new CircleGeometry(.28, 18)), k.dark);
		door.position.set(x, .62, -11.98);
		scene.add(door);
		const led = new Mesh(keepG(new BoxGeometry(.05, .03, .02)), k.ledMat);
		led.position.set(x + .32, 1.05, -11.98);
		scene.add(led);
		block(x - .55, x + .55, -12.75, -11.95);
	}
	box(.7, 1.35, .45, k.dark, -6.35, .68, -8.15);
	block(-6.75, -5.95, -8.45, -7.85);
	box(.9, 1.5, .45, k.std("#c9c3b8"), -10.55, .75, -8.55);
	block(-11.05, -10.05, -8.85, -8.25);
	box(.12, 2.2, 3.1, k.std("#2a2428"), 9.85, 1.1, 3.9);
	box(2.4, 2.2, .1, k.std("#2a2428"), 8.6, 1.1, 5.45);
	box(2.4, 2.2, .1, k.std("#2a2428"), 8.6, 1.1, 2.35);
	block(9.7, 10.05, 2.4, 5.5);
	block(7.4, 9.9, 5.3, 5.6);
	block(7.4, 9.9, 2.2, 2.5);
	const curtain = new Mesh(keepG(new PlaneGeometry(1.5, 2.05)), k.std("#3a2433", .9));
	curtain.position.set(7.55, 1.15, 3.2);
	curtain.rotation.y = .5;
	scene.add(curtain);
	const curtain2 = curtain.clone();
	curtain2.position.set(7.55, 1.15, 4.7);
	curtain2.rotation.y = -.5;
	scene.add(curtain2);
	const stool = new Mesh(keepG(new CylinderGeometry(.18, .18, .08, 12)), k.metal);
	stool.position.set(8.35, .48, 3.95);
	const leg = new Mesh(keepG(new CylinderGeometry(.03, .03, .46, 8)), k.metal);
	leg.position.set(8.35, .23, 3.95);
	scene.add(stool, leg);
	const tube = new Mesh(keepG(new BoxGeometry(.08, .7, .08)), k.pinkMat);
	tube.position.set(9.55, 1.5, 5.1);
	scene.add(tube);
	box(1.4, .9, .45, k.dark, 5.1, .5, 4.6);
	const boothScreen = new Mesh(keepG(new PlaneGeometry(.7, .45)), keepM(new MeshStandardMaterial({
		color: "#2a121c",
		emissive: "#ff8eb8",
		emissiveIntensity: .7
	})));
	boothScreen.position.set(6.3, 1.35, 4.2);
	boothScreen.rotation.y = -.6;
	scene.add(boothScreen);
	const stripTex = new TextureLoader().load("/textures/strip.jpg");
	stripTex.colorSpace = SRGBColorSpace;
	stripTex.anisotropy = aniso;
	keepT(stripTex);
	const strip = new Mesh(keepG(new PlaneGeometry(.2, .46)), keepM(new MeshStandardMaterial({
		map: stripTex,
		roughness: .65
	})));
	strip.rotation.x = -Math.PI / 2;
	strip.position.set(5.15, .025, 1.05);
	scene.add(strip);
	pickups.set("photostrip", strip);
	box(1.3, 2.15, .08, k.std("#4a3030"), 4.55, 1.08, -16.85);
	const dlabel = new Mesh(keepG(new PlaneGeometry(.4, .28)), keepM(new MeshStandardMaterial({
		map: keepT(plainLabel("1", 128, 96, "#f4efe6", "#7a2430", 64, aniso)),
		roughness: .5
	})));
	dlabel.position.set(4.55, 1.55, -16.78);
	scene.add(dlabel);
	box(2.2, .45, .7, k.std("#6a3a3a"), 8.3, .28, -19.15);
	block(7.2, 9.4, -19.55, -18.75);
	const tv = new Mesh(keepG(new PlaneGeometry(1.1, .62)), keepM(new MeshStandardMaterial({
		color: "#2a1218",
		emissive: "#ff8eae",
		emissiveIntensity: .55
	})));
	tv.position.set(8.3, 1.35, -20.15);
	scene.add(tv);
	const carrel = (x, z, num, lit = false) => {
		const sx = 1.05;
		const sz = .62;
		box(sx, .045, sz, k.wood, x, .72, z);
		box(.05, .68, .05, k.dark, x - sx / 2 + .05, .34, z - sz / 2 + .05);
		box(.05, .68, .05, k.dark, x + sx / 2 - .05, .34, z - sz / 2 + .05);
		box(.05, .68, .05, k.dark, x - sx / 2 + .05, .34, z + sz / 2 - .05);
		box(.05, .68, .05, k.dark, x + sx / 2 - .05, .34, z + sz / 2 - .05);
		box(sx, .46, .04, k.wood, x, .98, z - sz / 2);
		box(.04, .4, sz, k.wood, x - Math.sign(x || 1) * (sx / 2), .94, z);
		const lab = new Mesh(keepG(new PlaneGeometry(.24, .16)), keepM(new MeshStandardMaterial({
			map: keepT(plainLabel(num, 128, 96, lit ? "#1c1915" : "#f4efe6", lit ? "#f0d7a4" : "#2c2824", 64, aniso)),
			roughness: .55
		})));
		lab.position.set(x + .28, 1.08, z - sz / 2 + .03);
		scene.add(lab);
		box(.36, .05, .36, k.dark, x, .46, z + .52);
		box(.36, .28, .04, k.dark, x, .62, z + .68);
		if (lit) {
			const lamp = new Mesh(keepG(new BoxGeometry(.22, .04, .1)), k.tubeMat);
			lamp.position.set(x - .28, .78, z - .12);
			scene.add(lamp);
			const pl = new PointLight(16766888, 7, 3.4, 2);
			pl.position.set(x, 1.15, z);
			scene.add(pl);
			box(.22, .008, .16, k.std("#f7f1e4"), x + .08, .75, z + .04);
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
	const rules = new Mesh(keepG(new PlaneGeometry(.7, .9)), keepM(new MeshStandardMaterial({
		map: keepT(plainLabel("이용수칙", 256, 320, "#1c1915", "#f3ecdf", 48, aniso)),
		roughness: .8
	})));
	rules.position.set(-2.2, 1.45, -24.45);
	scene.add(rules);
	for (let i = 0; i < 5; i++) box(4.6, .16, .42, k.std("#b7b1a8"), -6, .08 + i * .16, 14.55 + i * .28);
	const half = new Mesh(keepG(new BoxGeometry(4.8, 1.85, .08)), shutterMatSafe(k, keepM, keepT));
	half.position.set(-6, 2.1, 14.35);
	scene.add(half);
	block(-8.6, -3.4, 14.15, 14.9, "stair");
	const exit = new Mesh(keepG(new PlaneGeometry(.7, .32)), k.exitMat);
	exit.position.set(-6, 2.55, 13.55);
	scene.add(exit);
	const exitText = new Mesh(keepG(new PlaneGeometry(.62, .24)), keepM(new MeshStandardMaterial({
		map: keepT(plainLabel("출구 4", 256, 96, "#f4fff8", "#14663a", 48, aniso)),
		roughness: .4
	})));
	exitText.position.set(-6, 2.55, 13.5);
	scene.add(exitText);
	box(1.15, 1.85, .5, k.dark, 0, .95, -37.85);
	block(-.65, .65, -38.2, -37.5);
	for (let i = 0; i < 5; i++) {
		const dot = new Mesh(keepG(new BoxGeometry(.05, .05, .02)), i % 2 ? k.ledMat : k.std("#c4463a"));
		dot.position.set(-.35, 1.5 - i * .22, -37.58);
		scene.add(dot);
	}
	const term = new Mesh(keepG(new PlaneGeometry(.55, .36)), keepM(new MeshStandardMaterial({
		color: "#102018",
		emissive: "#8fd0c4",
		emissiveIntensity: .45
	})));
	term.position.set(.05, 1.25, -37.58);
	scene.add(term);
	const doorMat = keepM(new MeshStandardMaterial({
		color: "#8a8680",
		roughness: .45,
		metalness: .3
	}));
	const door = new Mesh(keepG(new BoxGeometry(3.15, 2.72, .1)), doorMat);
	door.position.set(0, 1.36, -33.05);
	const win = new Mesh(keepG(new PlaneGeometry(.62, .22)), keepM(new MeshStandardMaterial({
		color: "#14201c",
		emissive: "#8fd0c4",
		emissiveIntensity: .35,
		roughness: .25,
		metalness: .35
	})));
	win.position.set(0, .55, .055);
	const bar = new Mesh(keepG(new BoxGeometry(1.35, .055, .05)), k.metal);
	bar.position.set(0, -.28, .07);
	door.add(win, bar);
	scene.add(door);
	const doorSign = new Mesh(keepG(new PlaneGeometry(1.4, .32)), keepM(new MeshStandardMaterial({
		map: keepT(plainLabel("설비 복도", 512, 128, "#f4efe6", "#2a2e2c", 52, aniso)),
		roughness: .5
	})));
	doorSign.position.set(0, 2.84, -32.9);
	scene.add(doorSign);
	block(-2.2, 2.2, -33.5, -32.55, "door");
	const pharmacyLight = new PointLight(10416351, 0, 6, 2);
	pharmacyLight.position.set(-1.7, 2.2, -4.55);
	scene.add(pharmacyLight);
	box(.45, .45, 1.2, k.metal, 1.85, .25, 9.1);
	block(1.55, 2.15, 8.45, 9.75);
	const ext = new Mesh(keepG(new CylinderGeometry(.09, .09, .5, 10)), k.std("#b4332c", .5));
	ext.position.set(2.05, .3, 10.6);
	scene.add(ext);
	const bin = new Mesh(keepG(new CylinderGeometry(.18, .16, .45, 10)), k.dark);
	bin.position.set(-1.85, .24, 5.2);
	scene.add(bin);
	scene.userData = {
		cams,
		b2,
		clock,
		door,
		pharmacyLight
	};
}
function shutterMatSafe(k, keepM, _keepT) {
	return keepM(new MeshStandardMaterial({
		color: "#8e8a84",
		roughness: .45,
		metalness: .25
	}));
}
var CAMS = [
	{
		name: "주통로",
		minX: -2.3,
		maxX: 2.3,
		minZ: -22,
		maxZ: 16
	},
	{
		name: "아이스",
		minX: -11.1,
		maxX: -3.3,
		minZ: -1.9,
		maxZ: 6.1
	},
	{
		name: "세탁",
		minX: -11.5,
		maxX: -3.3,
		minZ: -13.1,
		maxZ: -5.9
	},
	{
		name: "네컷",
		minX: 3.2,
		maxX: 10.5,
		minZ: -2.3,
		maxZ: 6.5
	}
];
var FONT = "\"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
function drawCams(ctx, px, pz, ghost) {
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;
	ctx.fillStyle = "#10140f";
	ctx.fillRect(0, 0, w, h);
	const pad = 10;
	const cw = (w - 50) / 4;
	const ch = h - 36;
	CAMS.forEach((cam, i) => {
		const x = pad + i * (cw + pad);
		const y = 8;
		ctx.fillStyle = "#1c2620";
		ctx.fillRect(x, y, cw, ch);
		ctx.strokeStyle = "#8fd0c4";
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, cw, ch);
		ctx.fillStyle = "#d7ecdf";
		ctx.font = `700 28px ${FONT}`;
		ctx.fillText(cam.name, x + 12, 44);
		const dot = (wx, wz, color) => {
			if (wx < cam.minX || wx > cam.maxX || wz < cam.minZ || wz > cam.maxZ) return;
			const u = (wx - cam.minX) / (cam.maxX - cam.minX);
			const v = (wz - cam.minZ) / (cam.maxZ - cam.minZ);
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x + 16 + u * (cw - 32), 64 + v * (ch - 80), 7, 0, Math.PI * 2);
			ctx.fill();
		};
		dot(px, pz, "#f4f1e4");
		if (ghost && cam.name === "네컷") dot(8.3, 4.1, "#8fd0c4");
	});
}
function drawB2(ctx, on, open) {
	const { width: w, height: h } = ctx.canvas;
	ctx.fillStyle = "#0c0f0c";
	ctx.fillRect(0, 0, w, h);
	if (!on) {
		ctx.fillStyle = "#182018";
		for (let i = 0; i < 18; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 40, 2);
		ctx.fillStyle = "#6d7a70";
		ctx.font = `700 36px ${FONT}`;
		ctx.textAlign = "center";
		ctx.fillText("NO SIGNAL", w / 2, h / 2);
		ctx.textAlign = "left";
		return;
	}
	ctx.strokeStyle = "#8fd0c4";
	ctx.strokeRect(40, 40, w - 80, h - 80);
	for (let i = 0; i < 6; i++) {
		ctx.fillStyle = i % 2 ? "#8fd0c4" : "#c4463a";
		ctx.fillRect(70, 80 + i * 48, 18, 18);
	}
	ctx.fillStyle = "#e7f6ef";
	ctx.font = `700 42px ${FONT}`;
	ctx.fillText("B2-1842", 120, 140);
	ctx.font = `500 32px ${FONT}`;
	ctx.fillStyle = open ? "#8fd0c4" : "#e7d7a2";
	ctx.fillText(open ? "문 열림" : "승인 대기", 120, 200);
}
var KEY = "neulbam-b2-v1";
var EMPTY_SAVE = {
	v: 1,
	found: [],
	ending: null,
	playerName: "",
	serviceOpen: false,
	sens: 1
};
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {
			...EMPTY_SAVE,
			found: []
		};
		const p = JSON.parse(raw);
		if (p.v !== 1 || !Array.isArray(p.found)) return {
			...EMPTY_SAVE,
			found: []
		};
		return {
			v: 1,
			found: p.found.filter((x) => typeof x === "string"),
			ending: p.ending === "name" || p.ending === "1842" || p.ending === "blank" ? p.ending : null,
			playerName: typeof p.playerName === "string" ? p.playerName.slice(0, 12) : "",
			serviceOpen: Boolean(p.serviceOpen),
			sens: typeof p.sens === "number" && p.sens > .4 && p.sens < 2 ? p.sens : 1
		};
	} catch {
		return {
			...EMPTY_SAVE,
			found: []
		};
	}
}
function writeSave(data) {
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}
function clearSave() {
	try {
		localStorage.removeItem(KEY);
	} catch {}
}
var EYE = 1.58;
var WALK = 2.35;
var Game = class {
	canvas;
	renderer;
	camera;
	world;
	audio = new Ambience();
	keys = /* @__PURE__ */ new Set();
	override = null;
	alive = true;
	raf = 0;
	last = 0;
	t = 0;
	x = 0;
	z = 12.2;
	yaw = 0;
	pitch = -.05;
	lookX = 0;
	lookY = 0;
	stickX = 0;
	stickY = 0;
	stickActive = false;
	sens = 1;
	userLook = false;
	found = /* @__PURE__ */ new Set();
	ending = null;
	playerName = "";
	serviceOpen = false;
	leftPhoto = false;
	minutes = 238;
	speed = 0;
	bodies = /* @__PURE__ */ new Map();
	toastUntil = 0;
	monitorAt = 0;
	prevE = false;
	reduce = false;
	ring;
	onKeyDown = (e) => {
		this.keys.add(e.code);
		if ([
			"KeyW",
			"KeyA",
			"KeyS",
			"KeyD",
			"KeyE",
			"Space",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight"
		].includes(e.code)) e.preventDefault();
	};
	onKeyUp = (e) => this.keys.delete(e.code);
	onBlur = () => this.keys.clear();
	onVis = () => {
		if (document.hidden) this.keys.clear();
		else this.audio.resume();
	};
	constructor(canvas) {
		this.canvas = canvas;
	}
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
			hint: this.hint()
		});
		await ensureFont();
		if (!this.alive) return;
		try {
			this.renderer = new WebGLRenderer({
				canvas: this.canvas,
				antialias: true,
				powerPreference: "high-performance",
				alpha: false
			});
		} catch (err) {
			useGame.setState({
				error: "이 기기에서는 3D를 열 수 없습니다.",
				ready: false
			});
			console.error(err);
			return;
		}
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = 4;
		this.renderer.toneMappingExposure = .96;
		this.renderer.setClearColor(12762032);
		const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
		this.world = buildWorld(aniso);
		this.applyPersistent();
		this.camera = new PerspectiveCamera(70, 1, .08, 80);
		this.ring = new Mesh(new RingGeometry(.2, .28, 24), new MeshBasicMaterial({
			color: 9425092,
			transparent: true,
			opacity: .9,
			side: 2
		}));
		this.ring.rotation.x = -Math.PI / 2;
		this.ring.position.y = .03;
		this.world.scene.add(this.ring);
		this.resize();
		new ResizeObserver(() => this.resize()).observe(this.canvas);
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
		document.addEventListener("visibilitychange", this.onVis);
		gameApi.current = this;
		window.__controlsTest = {
			getYaw: () => this.yaw,
			getSpeed: () => this.speed,
			getPos: () => ({
				x: this.x,
				z: this.z
			}),
			setKeys: (codes) => {
				this.override = new Set(codes);
			},
			teleport: (x, z, yaw) => {
				this.x = x;
				this.z = z;
				if (yaw !== void 0) this.yaw = yaw;
				this.userLook = true;
			}
		};
		useGame.setState({
			ready: true,
			error: null
		});
		this.last = performance.now();
		const loop = (now) => {
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
	setLook(dx, dy) {
		if (dx || dy) this.userLook = true;
		this.lookX += dx;
		this.lookY += dy;
	}
	setStick(x, y, active) {
		this.stickX = x;
		this.stickY = y;
		this.stickActive = active;
	}
	setSens(n) {
		this.sens = Math.min(1.8, Math.max(.55, n));
		useGame.setState({ sens: this.sens });
		this.persist();
	}
	closeOverlay() {
		useGame.setState({
			sheet: null,
			log: false
		});
	}
	openLog() {
		useGame.setState({
			log: true,
			sheet: null
		});
	}
	reread(id) {
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
				paragraphs: BADGE_LOCKED
			});
			return;
		}
		if (spot.id === "door") {
			this.showSheet({
				id: "door",
				title: "설비문",
				place: "북쪽 복도",
				chapter: "동선",
				paragraphs: this.hasCore() ? DOOR_WAIT : DOOR_LOCKED
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
	choose(kind, name) {
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
	frame(now) {
		const dt = Math.min(.1, (now - this.last) / 1e3 || 0);
		this.last = now;
		this.t += dt;
		const ui = useGame.getState();
		const paused = Boolean(ui.sheet || ui.log || !ui.playing);
		this.yaw -= this.lookX * .0052 * this.sens;
		this.pitch -= this.lookY * .0044 * this.sens;
		this.lookX = 0;
		this.lookY = 0;
		this.pitch = Math.max(-1.02, Math.min(.95, this.pitch));
		if (!ui.playing && !this.userLook && !this.reduce) this.yaw = Math.sin(this.t * .15) * .22;
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
			while (left > 1e-4) {
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
			this.world.flicker.userData.base ?? this.world.flicker.intensity;
			if (!this.world.flicker.userData.base) this.world.flicker.userData.base = this.world.flicker.intensity || 28;
			const n = Math.sin(this.t * 17) + Math.sin(this.t * 43);
			this.world.flicker.intensity = this.world.flicker.userData.base * (n > 1.3 ? .35 : 1);
		}
		if (this.serviceOpen && this.world.door.position.y < 3.75) this.world.door.position.y += (3.8 - this.world.door.position.y) * Math.min(1, dt * 2.4);
		this.trackGhost();
		const place = placeAt(this.x, this.z);
		const clock = this.clockText();
		const spot = ui.playing && !ui.sheet && !ui.log ? this.nearest() : null;
		const prompt = spot?.label ?? null;
		if (place !== ui.place || clock !== ui.clock || prompt !== ui.prompt) useGame.setState({
			place,
			clock,
			prompt
		});
		if (this.toastUntil && now > this.toastUntil && ui.toast) {
			this.toastUntil = 0;
			useGame.setState({ toast: null });
		}
		this.monitorAt -= dt;
		if (this.monitorAt <= 0) {
			this.monitorAt = .25;
			drawCams(this.world.cams.ctx, this.x, this.z, this.ghostOn());
			this.world.cams.tex.needsUpdate = true;
			drawB2(this.world.b2.ctx, this.hasCore(), this.serviceOpen);
			this.world.b2.tex.needsUpdate = true;
			const cg = this.world.clock.ctx;
			cg.fillStyle = "#10210f";
			cg.fillRect(0, 0, cg.canvas.width, cg.canvas.height);
			cg.fillStyle = "#d9ffd0";
			cg.font = "700 120px \"Noto Sans KR\", \"WenQuanYi Zen Hei\", sans-serif";
			cg.textAlign = "center";
			cg.textBaseline = "middle";
			cg.fillText(clock, cg.canvas.width / 2, cg.canvas.height / 2);
			cg.textAlign = "left";
			this.world.clock.tex.needsUpdate = true;
		}
		const bob = !this.reduce && this.speed > .2 ? Math.sin(this.t * 9.2) * .012 : 0;
		this.camera.position.set(this.x, EYE + bob, this.z);
		this.camera.rotation.order = "YXZ";
		this.camera.rotation.y = this.yaw;
		this.camera.rotation.x = this.pitch;
		if (spot && ui.playing) {
			this.ring.visible = true;
			this.ring.position.x = spot.x;
			this.ring.position.z = spot.z;
			const s = 1 + Math.sin(this.t * 4) * .06;
			this.ring.scale.set(s, s, s);
		} else this.ring.visible = false;
		this.renderer.render(this.world.scene, this.camera);
	}
	step(h, ix, iz) {
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
	readPad(dt, add) {
		const gp = (navigator.getGamepads?.())?.[0];
		if (!gp) return;
		const dz = .18;
		let x = gp.axes[0] ?? 0;
		let y = gp.axes[1] ?? 0;
		const m = Math.hypot(x, y);
		if (m > dz) {
			const s = (m - dz) / .8200000000000001 / m;
			add(x * s, -y * s);
		}
		const lx = gp.axes[2] ?? 0;
		const ly = gp.axes[3] ?? 0;
		if (Math.hypot(lx, ly) > .22) {
			this.yaw -= lx * dt * 1.7;
			this.pitch -= ly * dt * 1.25;
			this.userLook = true;
		}
	}
	nearest() {
		const fx = -Math.sin(this.yaw);
		const fz = -Math.cos(this.yaw);
		let best = null;
		let bestD = Infinity;
		for (const spot of SPOTS) {
			if (spot.id === "door" && this.serviceOpen) continue;
			if (spot.id === "terminal" && !this.serviceOpen) continue;
			const dx = spot.x - this.x;
			const dz = spot.z - this.z;
			const d = Math.hypot(dx, dz);
			if (d > (spot.range ?? 1.65) || d > bestD) continue;
			if (d > .75) {
				if ((dx * fx + dz * fz) / d < .2) continue;
			}
			best = spot;
			bestD = d;
		}
		if (!best) return null;
		if (best.id === "badge" && !this.found.has("drawer-key")) return {
			...best,
			label: "잠긴 캐비닛"
		};
		if (best.id === "terminal" && this.ending) return {
			...best,
			label: "저장된 단말"
		};
		if (best.id === "pharmacy" && this.ending) return {
			...best,
			label: "켜진 약국"
		};
		return best;
	}
	hasCore() {
		return CORE.every((id) => this.found.has(id));
	}
	ghostOn() {
		return this.found.has("photostrip") && !this.found.has("booth-return") && this.leftPhoto;
	}
	trackGhost() {
		if (!this.found.has("photostrip") || this.found.has("booth-return")) return;
		if (!(placeAt(this.x, this.z) === "늘밤네컷")) this.leftPhoto = true;
		else if (this.leftPhoto) {
			this.collect("booth-return");
			this.toast("부스는 비어 있다.");
		}
	}
	clockEvents() {
		if (this.found.has("laundry-ticket") && !this.found.has("laundry-late") && this.minutes >= 280) {
			this.collect("laundry-late");
			this.toast("04:40이 지났다. 통은 아직 돈다.");
		}
		if (!this.found.has("first-train") && this.minutes >= 300 && useGame.getState().playing) {
			this.collect("first-train");
			this.toast("05:00. 남쪽 셔터는 그대로다.");
		}
	}
	clockText() {
		const m = Math.floor(this.minutes);
		const h = Math.floor(m / 60) % 24;
		const min = m % 60;
		return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
	}
	hint() {
		if (this.ending === "blank") return "출구 번호가 꺼졌다";
		if (this.ending) return "서쪽 셔터를 다시 본다";
		if (!this.found.has("handover")) return HINTS.handover;
		const next = CORE.find((id) => !this.found.has(id));
		if (next) return HINTS[next];
		if (!this.serviceOpen) return HINTS.cctv;
		return HINTS.terminal;
	}
	refreshHint() {
		useGame.setState({ hint: this.hint() });
	}
	collect(id) {
		if (this.found.has(id)) return;
		this.found.add(id);
		const mesh = this.world.pickups.get(id);
		if (mesh) mesh.visible = false;
		if (id === "laundry-ticket" && this.minutes >= 280) this.collect("laundry-late");
		useGame.setState({
			found: [...this.found],
			ending: this.ending
		});
		this.refreshHint();
		this.persist();
	}
	endingId() {
		return this.ending === "name" ? "end-name" : this.ending === "1842" ? "end-1842" : "end-blank";
	}
	sheetFor(id) {
		const e = ENTRIES[id];
		if (!e) return {
			id,
			title: "기록",
			place: "",
			chapter: "",
			paragraphs: []
		};
		return {
			id,
			title: e.title,
			place: e.place,
			chapter: chapterTitle(e.chapter),
			paragraphs: this.bodies.get(id) ?? e.body
		};
	}
	terminalSheet() {
		return {
			id: "terminal",
			title: "이름 칸",
			place: "설비 복도",
			chapter: "인수인계",
			paragraphs: TERMINAL_BODY,
			terminal: true
		};
	}
	showSheet(sheet) {
		useGame.setState({
			sheet,
			log: false
		});
	}
	toast(msg) {
		this.toastUntil = performance.now() + 3600;
		useGame.setState({ toast: msg });
	}
	openDoor(anim) {
		const i = this.world.blocks.findIndex((b) => b.tag === "door");
		if (i >= 0) this.world.blocks.splice(i, 1);
		if (!anim) this.world.door.position.y = 3.8;
	}
	applyEndingVisual() {
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
	applyPersistent() {
		for (const id of this.found) {
			const mesh = this.world.pickups.get(id);
			if (mesh) mesh.visible = false;
		}
		if (this.serviceOpen) this.openDoor(false);
		if (this.ending) this.applyEndingVisual();
	}
	persist() {
		writeSave({
			v: 1,
			found: [...this.found],
			ending: this.ending,
			playerName: this.playerName,
			serviceOpen: this.serviceOpen,
			sens: this.sens
		});
	}
	resize() {
		const w = this.canvas.clientWidth || 1;
		const h = this.canvas.clientHeight || 1;
		const dpr = Math.min(window.devicePixelRatio || 1, w < 520 ? 1.35 : 1.6);
		this.renderer.setPixelRatio(dpr);
		this.renderer.setSize(w, h, false);
		const aspect = w / h;
		if (aspect >= 1) this.camera.fov = 68;
		else {
			const vf = 2 * Math.atan(Math.tan(74 * Math.PI / 180 / 2) / Math.max(aspect, .34));
			this.camera.fov = Math.min(104, vf * 180 / Math.PI);
		}
		this.camera.aspect = aspect;
		this.camera.updateProjectionMatrix();
	}
};
//#endregion
export { Game };
