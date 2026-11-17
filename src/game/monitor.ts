export type Cam = { name: string; minX: number; maxX: number; minZ: number; maxZ: number };

export const CAMS: Cam[] = [
  { name: "주통로", minX: -2.3, maxX: 2.3, minZ: -22, maxZ: 16 },
  { name: "아이스", minX: -11.1, maxX: -3.3, minZ: -1.9, maxZ: 6.1 },
  { name: "세탁", minX: -11.5, maxX: -3.3, minZ: -13.1, maxZ: -5.9 },
  { name: "네컷", minX: 3.2, maxX: 10.5, minZ: -2.3, maxZ: 6.5 },
];

const FONT = '"Noto Sans KR", "WenQuanYi Zen Hei", sans-serif';

export function drawCams(
  ctx: CanvasRenderingContext2D,
  px: number,
  pz: number,
  ghost: boolean,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = "#10140f";
  ctx.fillRect(0, 0, w, h);
  const pad = 10;
  const cw = (w - pad * 5) / 4;
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
    ctx.fillText(cam.name, x + 12, y + 36);
    const dot = (wx: number, wz: number, color: string) => {
      if (wx < cam.minX || wx > cam.maxX || wz < cam.minZ || wz > cam.maxZ) return;
      const u = (wx - cam.minX) / (cam.maxX - cam.minX);
      const v = (wz - cam.minZ) / (cam.maxZ - cam.minZ);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 16 + u * (cw - 32), y + 56 + v * (ch - 80), 7, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(px, pz, "#f4f1e4");
    if (ghost && cam.name === "네컷") dot(8.3, 4.1, "#8fd0c4");
  });
}

export function drawB2(ctx: CanvasRenderingContext2D, on: boolean, open: boolean) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#0c0f0c";
  ctx.fillRect(0, 0, w, h);
  if (!on) {
    ctx.fillStyle = "#182018";
    for (let i = 0; i < 18; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 40, 2);
    }
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
