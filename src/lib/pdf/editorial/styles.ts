/** Identidades visuais dos temas Espaço, Futebol, Princesas, Fadas e Sereias. */
import type { RGB } from "../../editorial/types";
import { hex } from "../../editorial/colors";
import type { ThemeId } from "../../themes";
import type { SCtx, ThemeStyle } from "./storybook";
import type { Box } from "./units";
import { color, mix, mm, pt, shade } from "./units";
import { circle } from "./shapes";
import { bigLeaf, bladeLeaf, blobPoints, dottedPath, drawShape, rng, sparkle, xMark } from "./jungle";
import {
  boot, bubble, bunting, castle, chest, comet, cone, coral, crown, fish, flower, gem, glow, goalNet, heart, mushroom,
  pearl, planet, rocket, rose, seaweed, shell, soccerBall, star5, starField, starfish, trophy, wand, waveLine, whistle, butterfly,
} from "./motifs";

const W: RGB = [1, 1, 1];
const faint = (c: SCtx, k = 0.28): RGB => mix(c.st.sheet.fill, c.st.sheet.edge, k);

function moon(c: SCtx, cx: number, cy: number, r: number, col: RGB) {
  circle(c.page, cx, cy, r, { fill: col });
  circle(c.page, cx + r * 0.42, cy - r * 0.26, r * 0.86, { fill: c.st.sheet.fill });
}

function mirror(c: SCtx, cx: number, cy: number, h: number, frame: RGB, glass: RGB) {
  const p = pt(c.page, cx, cy);
  c.page.drawRectangle({ ...pt(c.page, cx - h * 0.06, cy + h * 0.72), width: mm(h * 0.12), height: mm(h * 0.32), color: color(shade(frame, 0.8)) });
  c.page.drawEllipse({ x: p.x, y: p.y, xScale: mm(h * 0.34), yScale: mm(h * 0.45), color: color(frame), borderColor: color(shade(frame, 0.65)), borderWidth: mm(0.25) });
  c.page.drawEllipse({ x: p.x, y: p.y, xScale: mm(h * 0.26), yScale: mm(h * 0.36), color: color(glass) });
  drawShape(c.page, [{ x: cx - h * 0.14, y: cy - h * 0.2 }, { x: cx - h * 0.04, y: cy - h * 0.28 }, { x: cx + h * 0.08, y: cy + h * 0.1 }, { x: cx - h * 0.02, y: cy + h * 0.18 }], { fill: W, opacity: 0.5 });
}

function arcs(c: SCtx, sc: Box, col: RGB, n = 3) {
  for (let i = 0; i < n; i++) {
    const r = 3 + i * 2.4;
    for (const side of [-1, 1]) {
      const cx = side < 0 ? sc.x - 1 : sc.x + sc.w + 1;
      const cy = sc.y + sc.h * 0.45;
      const p0 = pt(c.page, cx, cy - r);
      c.page.drawSvgPath(`M 0 0 A ${mm(r)} ${mm(r)} 0 0 ${side > 0 ? 1 : 0} 0 ${mm(2 * r)}`, { x: p0.x, y: p0.y, borderColor: color(col), borderWidth: mm(0.55), borderOpacity: 1 - i * 0.25 });
    }
  }
}

function confetti(c: SCtx, box: Box, seed: number, cols: RGB[], n = 18) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = box.x + r() * box.w;
    const y = box.y + r() * box.h;
    const col = cols[i % cols.length];
    drawShape(c.page, [{ x, y }, { x: x + 1.4, y: y + 0.3 }, { x: x + 1.2, y: y + 1 }, { x: x - 0.2, y: y + 0.7 }], { fill: col, sharp: true });
  }
}

// ═══════════════════════════ ESPAÇO ═══════════════════════════
const NAVY = hex("#151c52");
const espaco: ThemeStyle = {
  font: "Fredoka-Bold.ttf",
  band: NAVY,
  bandDecor(c, o, seed) {
    const r = rng(seed);
    starField(c.page, o.x, o.y, o.w, o.h, seed, Math.round((o.w * o.h) / 30), W);
    for (let i = 0; i < Math.round(o.h / 18); i++) sparkle(c.page, o.x + r() * o.w, o.y + r() * o.h, 0.8 + r() * 1.2, hex("#ffe38a"));
    planet(c.page, o.x + o.w - 4, o.y + 10, 6, hex("#e2563d"), { craters: true });
    planet(c.page, o.x + 3, o.y + o.h - 14, 5, hex("#8e5cf0"), { ring: hex("#ffd56b") });
  },
  sheet: { shape: "panel", fill: hex("#f2f4ff"), edge: hex("#8f9be0") },
  edgeDecor(c, o, b, seed, page) {
    const r = rng(seed);
    const k = page ? 1.8 : 1;
    for (let i = 0; i < (page ? 10 : 5); i++) {
      const side = i % 2 ? b.x + b.w : b.x;
      star5(c.page, side + (r() - 0.5) * 2, b.y + 25 + r() * (b.h - 50), 1 + r() * 1.2, i % 3 ? hex("#ffd56b") : W, { stroke: hex("#c58a10") });
    }
    planet(c.page, b.x + b.w - 3 * k, b.y + b.h - 3 * k, 5.5 * k, hex("#4fb3e8"), { bands: true });
    planet(c.page, b.x + 2.5 * k, b.y + b.h - 2.5 * k, 3.8 * k, hex("#c9c4bd"), { craters: true });
    if (page) {
      rocket(c.page, b.x + 10, b.y + 18, 20, 35);
      planet(c.page, b.x + b.w - 8, b.y + 14, 7, hex("#8e5cf0"), { ring: hex("#ffd56b") });
      comet(c.page, b.x + b.w - 30, b.y + 52, 14, 200, hex("#ffe38a"));
    }
  },
  header: "pill",
  headerColors: { fill: hex("#26368c"), dark: hex("#0f1640"), text: W, sub: hex("#ffd56b") },
  headerDecor(c, s) {
    star5(c.page, s.x + 3.5, s.y + 3, 1.2, hex("#ffd56b"));
    star5(c.page, s.x + s.w - 3.2, s.y + s.h - 3, 0.9, W);
  },
  badge: { fill: hex("#1f2b74"), edge: hex("#ffd56b") },
  emblem(c, cx, cy, r) {
    planet(c.page, cx, cy, r * 0.55, hex("#8e5cf0"), { ring: hex("#ffd56b") });
    star5(c.page, cx + r * 0.75, cy - r * 0.7, r * 0.18, W);
  },
  frame: { fill: hex("#26368c"), stroke: hex("#121a4a"), ring: hex("#ffd56b") },
  challenge: { fill: hex("#e3e7ff"), stroke: hex("#7c89d6"), pill: hex("#6c4ce0"), pillDark: hex("#3b2a99"), pillText: W },
  watermark(c, x, y, s, rot) {
    star5(c.page, x, y, s * 0.55, faint(c), { rot });
  },
  vignette: {
    start(c, b) {
      const y0 = b.y + b.h - 3;
      dottedPath(c.page, { x: b.x + 12, y: y0 - 2 }, { x: b.x + 22, y: b.y + 2 }, { x: b.x + 50, y: b.y + 2 }, { x: b.x + b.w - 14, y: b.y + b.h * 0.45 }, hex("#6c4ce0"), 0.4, 1.7);
      rocket(c.page, b.x + 11, y0 - Math.min(9, b.h * 0.35), Math.min(16, b.h * 0.85), 30);
      planet(c.page, b.x + b.w - 9, b.y + b.h * 0.5, Math.min(6, b.h * 0.3), hex("#e2563d"), { craters: true });
      for (const [dx, dy, s] of [[30, 0.2, 1.4], [44, 0.75, 1], [58, 0.15, 1.6]] as const) star5(c.page, b.x + dx, b.y + b.h * dy, s, hex("#f5b82e"));
    },
    rest(c, b) {
      const cy = b.y + b.h / 2;
      moon(c, b.x + b.w - 18, cy, Math.min(6.5, b.h * 0.38), hex("#f5c54a"));
      for (const [dx, dy, s] of [[-14, -0.25, 1.8], [-24, 0.2, 1.3], [8, 0.25, 1.4], [-34, -0.15, 1.1], [10, -0.3, 1]] as const) star5(c.page, b.x + b.w - 18 + dx, cy + dy * b.h, s, hex("#f5b82e"));
      planet(c.page, b.x + 12, cy, Math.min(5.5, b.h * 0.32), hex("#4fb3e8"), { bands: true });
    },
    trail(c, b) {
      const y = b.y + b.h / 2;
      dottedPath(c.page, { x: b.x + 6, y: y + 3 }, { x: b.x + 25, y: y - 10 }, { x: b.x + 45, y: y + 10 }, { x: b.x + b.w - 14, y: y - 2 }, hex("#6c4ce0"), 0.4, 1.7);
      planet(c.page, b.x + 8, y + 3, 3.2, hex("#e2563d"));
      planet(c.page, b.x + 36, y + 1, 2.6, hex("#4fb3e8"));
      // radar captando o sinal
      const rx = b.x + b.w - 9;
      for (let i = 1; i <= 3; i++) circle(c.page, rx, y - 2, i * 2.2, { stroke: hex("#22b8c9"), strokeW: 0.45 });
      circle(c.page, rx, y - 2, 1.2, { fill: hex("#22b8c9") });
      xMark(c.page, b.x + b.w - 22, y + 4, 1.1, hex("#c2410c"));
    },
    row(c, b) {
      for (let i = 0; i < 5; i++) {
        const x = b.x + 8 + i * ((b.w - 16) / 4);
        const y = b.y + b.h / 2 + Math.sin(i * 1.3) * 1.5;
        circle(c.page, x, y, 2.6, { fill: hex("#c9c4bd"), stroke: hex("#8a857f"), strokeW: 0.2 });
        circle(c.page, x - 0.8, y - 0.5, 0.7, { fill: hex("#a8a39c") });
        circle(c.page, x + 0.9, y + 0.6, 0.5, { fill: hex("#a8a39c") });
      }
    },
    burst(c, sc) {
      arcs(c, sc, hex("#22b8c9"));
      star5(c.page, sc.x + sc.w - 2, sc.y - 3.5, 2.2, hex("#f5b82e"));
      star5(c.page, sc.x + 2, sc.y - 2.5, 1.4, hex("#f5b82e"));
    },
    pair(c, b) {
      const cx = b.x + b.w / 2;
      rocket(c.page, cx - 6, b.y + b.h * 0.45, Math.min(24, b.h * 0.8), 0);
      for (let i = 0; i < 5; i++) {
        const y = b.y + 4 + i * ((b.h - 8) / 4);
        circle(c.page, cx + 9, y, 2.4 - i * 0.25, { fill: i === 4 ? hex("#c2410c") : hex("#6c4ce0") });
        const s = String(5 - i);
        const w = c.fonts.display.widthOfTextAtSize(s, 6.5) / (72 / 25.4);
        const q = pt(c.page, cx + 9 - w / 2, y + 0.95);
        c.page.drawText(s, { x: q.x, y: q.y, size: 6.5, font: c.fonts.display, color: color(W) });
      }
    },
    goal(c, x, y) {
      gem(c.page, x, y, 4.2, hex("#58c7f3"));
      sparkle(c.page, x + 5, y - 4, 1.6, hex("#f5b82e"));
      sparkle(c.page, x - 5, y + 2, 1.2, hex("#f5b82e"));
    },
    accents(c, sc, seed) {
      const r = rng(seed);
      star5(c.page, sc.x - 1.5, sc.y + 3, 1.8, hex("#f5b82e"), { stroke: hex("#c58a10") });
      star5(c.page, sc.x + sc.w + 1.5, sc.y + sc.h - 4, 1.5 + r(), hex("#f5b82e"), { stroke: hex("#c58a10") });
      planet(c.page, sc.x + sc.w - 4, sc.y + sc.h + 1.8, 2.4, hex("#e2563d"));
    },
    map(c, b) {
      dottedPath(c.page, { x: b.x + 22, y: b.y + 20 }, { x: b.x + 50, y: b.y + 50 }, { x: b.x + 110, y: b.y + 55 }, { x: b.x + b.w - 14, y: b.y + 26 }, hex("#6c4ce0"), 0.5, 2);
      rocket(c.page, b.x + 14, b.y + 18, 22, 40);
      planet(c.page, b.x + 62, b.y + 10, 6, hex("#e2563d"), { craters: true });
      planet(c.page, b.x + 40, b.y + 48, 4, hex("#4fb3e8"), { bands: true });
      gem(c.page, b.x + b.w - 10, b.y + 34, 4.5, hex("#58c7f3"));
      xMark(c.page, b.x + b.w - 4, b.y + 42, 2, hex("#c2410c"));
      starField(c.page, b.x, b.y, b.w, b.h, 77, 30, hex("#8f9be0"));
    },
    certFooter(c, b) {
      for (let i = 0; i < 7; i++) star5(c.page, b.x + 10 + i * ((b.w - 20) / 6), b.y + b.h / 2 + (i % 2 ? -2 : 2), i % 2 ? 2 : 2.8, hex("#f5b82e"), { stroke: hex("#c58a10") });
      planet(c.page, b.x + 2, b.y + b.h / 2, 4, hex("#8e5cf0"), { ring: hex("#ffd56b") });
      planet(c.page, b.x + b.w - 2, b.y + b.h / 2, 4, hex("#4fb3e8"), { bands: true });
    },
  },
  final: { frame: hex("#f5b82e"), frameDark: hex("#9a6a0a"), rays: hex("#ffd56b"), band: hex("#0e1440") },
  progress: hex("#6c4ce0"),
};

// ═══════════════════════════ FUTEBOL ═══════════════════════════
const GRASS = hex("#2f8f3f");
const futebol: ThemeStyle = {
  font: "LilitaOne-Regular.ttf",
  band: GRASS,
  bandDecor(c, o) {
    for (let x = o.x, i = 0; x < o.x + o.w; x += 6, i++) if (i % 2) c.page.drawRectangle({ ...pt(c.page, x, o.y + o.h), width: mm(6), height: mm(o.h), color: color(hex("#2a8238")) });
    const line = { thickness: mm(0.5), color: color(W), opacity: 0.85 };
    c.page.drawRectangle({ ...pt(c.page, o.x + 1.6, o.y + o.h - 1.6), width: mm(o.w - 3.2), height: mm(o.h - 3.2), borderColor: color(W), borderWidth: mm(0.5), borderOpacity: 0.85 });
    c.page.drawLine({ start: pt(c.page, o.x, o.y + o.h / 2), end: pt(c.page, o.x + o.w, o.y + o.h / 2), ...line });
    circle(c.page, o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) * 0.18, { stroke: W, strokeW: 0.5, opacity: 0.85 });
  },
  sheet: { shape: "torn", fill: hex("#fffcf0"), edge: hex("#b9c98f") },
  edgeDecor(c, o, b, seed, page) {
    const r = rng(seed);
    const g: RGB = hex("#3fae5b");
    for (let x = b.x + 2; x < b.x + b.w - 2; x += 1.6) bladeLeaf(c.page, x, b.y + b.h + 0.5, 2.2 + r() * 2.5, -90 + (r() - 0.5) * 40, 0.8, r() > 0.5 ? g : hex("#2a8238"), shade(g, 0.6));
    soccerBall(c.page, b.x + 3.5, b.y + b.h - 3.5, page ? 6 : 3.4);
    if (page) {
      bunting(c.page, b.x + 8, b.y + 2.2, b.x + b.w - 8, 18, [hex("#f2b705"), hex("#1d6b34"), hex("#1e4fb8"), W], 2, 3);
      cone(c.page, b.x + b.w - 8, b.y + b.h + 0.5, 9);
    } else {
      cone(c.page, b.x + b.w - 4, b.y + b.h + 0.5, 6);
    }
  },
  header: "board",
  headerColors: { fill: hex("#1d6b34"), dark: hex("#0b3417"), text: W, sub: hex("#f2b705") },
  headerDecor(c, s) {
    soccerBall(c.page, s.x + 0.5, s.y + 0.5, 3);
  },
  badge: { fill: W, edge: hex("#1d6b34") },
  emblem(c, cx, cy, r) {
    soccerBall(c.page, cx, cy, r * 0.82);
  },
  frame: { fill: hex("#1d6b34"), stroke: hex("#0f3d1c"), ring: hex("#f2b705") },
  challenge: { fill: hex("#eef6dc"), stroke: hex("#7aa34f"), pill: hex("#1d6b34"), pillDark: hex("#0f3d1c"), pillText: W },
  watermark(c, x, y, s) {
    circle(c.page, x, y, s * 0.6, { stroke: faint(c, 0.45), strokeW: 0.5 });
    drawShape(c.page, Array.from({ length: 5 }, (_, i) => ({ x: x + Math.cos(-Math.PI / 2 + (i / 5) * Math.PI * 2) * s * 0.22, y: y + Math.sin(-Math.PI / 2 + (i / 5) * Math.PI * 2) * s * 0.22 })), { fill: faint(c, 0.45), sharp: true });
  },
  vignette: {
    start(c, b) {
      const gy = b.y + 1;
      const gh = Math.min(13, b.h - 2);
      goalNet(c.page, b.x + b.w - 26, gy, 22, gh, hex("#7a8a6a"));
      dottedPath(c.page, { x: b.x + 12, y: b.y + b.h - 3 }, { x: b.x + 25, y: b.y }, { x: b.x + 45, y: b.y }, { x: b.x + b.w - 16, y: gy + gh * 0.5 }, hex("#1d6b34"), 0.4, 1.7);
      soccerBall(c.page, b.x + 10, b.y + b.h - 3.5, 3.2);
      whistle(c.page, b.x + 34, b.y + b.h * 0.6, 3.2);
    },
    rest(c, b) {
      const cy = b.y + b.h / 2;
      moon(c, b.x + b.w - 16, cy - 1, Math.min(6, b.h * 0.38), hex("#f2b705"));
      for (const [dx, dy, s] of [[-14, -0.25, 1.6], [-24, 0.2, 1.2], [7, 0.3, 1.3]] as const) star5(c.page, b.x + b.w - 16 + dx, cy + dy * b.h, s, hex("#f2b705"));
      soccerBall(c.page, b.x + 14, cy + 1, Math.min(4.5, b.h * 0.3));
    },
    trail(c, b) {
      const y = b.y + b.h / 2;
      dottedPath(c.page, { x: b.x + 6, y: y + 3 }, { x: b.x + 22, y: y - 10 }, { x: b.x + 42, y: y + 10 }, { x: b.x + b.w - 12, y: y - 2 }, hex("#1d6b34"), 0.4, 1.7);
      for (const [dx, dy] of [[16, -4], [34, 4], [50, -3]] as const) cone(c.page, b.x + dx, y + dy + 2.5, 5);
      soccerBall(c.page, b.x + b.w - 9, y - 2, 3.4);
    },
    row(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 5; i++) {
        const x = b.x + 7 + i * ((b.w - 14) / 4);
        if (i < 4) dottedPath(c.page, { x: x + 2.5, y: y - 1 }, { x: x + 5, y: y - 5 }, { x: x + 9, y: y - 5 }, { x: x + (b.w - 14) / 4 - 2.5, y: y - 1 }, hex("#1d6b34"), 0.25, 1.1);
        soccerBall(c.page, x, y, 2.4);
      }
    },
    burst(c, sc) {
      confetti(c, { x: sc.x - 6, y: sc.y - 6, w: sc.w + 12, h: 8 }, 41, [hex("#f2b705"), hex("#1e4fb8"), hex("#c81e1e"), hex("#1d6b34")]);
      star5(c.page, sc.x - 2, sc.y + sc.h * 0.5, 2, hex("#f2b705"));
      star5(c.page, sc.x + sc.w + 2, sc.y + sc.h * 0.4, 2.4, hex("#f2b705"));
    },
    pair(c, b) {
      goalNet(c.page, b.x + 3, b.y + 2, b.w - 6, Math.min(16, b.h * 0.5), hex("#7a8a6a"));
      dottedPath(c.page, { x: b.x + b.w / 2, y: b.y + b.h - 4 }, { x: b.x + b.w / 2 - 4, y: b.y + b.h * 0.6 }, { x: b.x + b.w / 2 + 4, y: b.y + b.h * 0.45 }, { x: b.x + b.w / 2 + 3, y: b.y + 9 }, hex("#1d6b34"), 0.3, 1.2);
      soccerBall(c.page, b.x + b.w / 2, b.y + b.h - 4, 3.2);
      boot(c.page, b.x + 5, b.y + b.h - 4, 1.4, hex("#1e4fb8"));
    },
    goal(c, x, y) {
      trophy(c.page, x, y, 11);
      sparkle(c.page, x + 5.5, y - 5, 1.5, hex("#f2b705"));
    },
    accents(c, sc, seed) {
      const r = rng(seed);
      const g: RGB = hex("#3fae5b");
      for (let i = 0; i < 9; i++) bladeLeaf(c.page, sc.x + 1 + i * 1.2, sc.y + sc.h + 1, 2 + r() * 2, -90 + (r() - 0.5) * 40, 0.8, g, shade(g, 0.6));
      soccerBall(c.page, sc.x + sc.w - 3, sc.y + sc.h + 1.5, 2.4);
    },
    map(c, b) {
      c.page.drawRectangle({ ...pt(c.page, b.x + 6, b.y + b.h - 4), width: mm(b.w - 12), height: mm(b.h - 12), color: color(hex("#dcefc9")), borderColor: color(hex("#9ccc7a")), borderWidth: mm(0.4) });
      c.page.drawLine({ start: pt(c.page, b.x + b.w / 2, b.y + 8), end: pt(c.page, b.x + b.w / 2, b.y + b.h - 4), thickness: mm(0.35), color: color(hex("#9ccc7a")) });
      circle(c.page, b.x + b.w / 2, b.y + b.h / 2 + 2, 8, { stroke: hex("#9ccc7a"), strokeW: 0.35 });
      dottedPath(c.page, { x: b.x + 20, y: b.y + 22 }, { x: b.x + 50, y: b.y + 52 }, { x: b.x + 110, y: b.y + 55 }, { x: b.x + b.w - 18, y: b.y + 26 }, hex("#1d6b34"), 0.5, 2);
      soccerBall(c.page, b.x + 16, b.y + 20, 5);
      for (const [dx, dy] of [[45, 40], [125, 46]] as const) cone(c.page, b.x + dx, b.y + dy, 7);
      trophy(c.page, b.x + b.w - 12, b.y + 22, 18);
    },
    certFooter(c, b) {
      for (let i = 0; i < 5; i++) soccerBall(c.page, b.x + 12 + i * ((b.w - 24) / 4), b.y + b.h / 2, 2.8);
      star5(c.page, b.x + 2, b.y + b.h / 2, 2.6, hex("#f2b705"));
      star5(c.page, b.x + b.w - 2, b.y + b.h / 2, 2.6, hex("#f2b705"));
    },
  },
  final: { frame: hex("#f2b705"), frameDark: hex("#8a6000"), rays: hex("#ffe27a"), band: hex("#1d6b34") },
  progress: hex("#1d6b34"),
};

// ═══════════════════════════ PRINCESAS ═══════════════════════════
const PINK = hex("#f3a3c3");
const princesas: ThemeStyle = {
  font: "Grandstander-ExtraBold.ttf",
  band: PINK,
  bandDecor(c, o) {
    const light = hex("#f9c9dc");
    for (let y = o.y + 3, j = 0; y < o.y + o.h; y += 7, j++)
      for (let x = o.x + 3 + (j % 2) * 3.5; x < o.x + o.w; x += 7) {
        if ((Math.round(x) + j) % 3 === 0) heart(c.page, x, y, 1.3, light);
        else drawShape(c.page, [{ x, y: y - 1 }, { x: x + 0.8, y }, { x, y: y + 1 }, { x: x - 0.8, y }], { fill: light, sharp: true });
      }
  },
  sheet: { shape: "ornate", fill: hex("#fff6f1"), edge: hex("#e7b7c4") },
  edgeDecor(c, o, b, seed, page) {
    const k = page ? 1.6 : 1;
    rose(c.page, b.x + 3 * k, b.y + b.h - 3 * k, 3 * k, hex("#e9558d"), seed);
    rose(c.page, b.x + 8 * k, b.y + b.h - 1.5 * k, 2.2 * k, hex("#f48fb1"), seed + 1);
    rose(c.page, b.x + b.w - 3 * k, b.y + b.h - 3 * k, 3 * k, hex("#e9558d"), seed + 2);
    rose(c.page, b.x + b.w - 8 * k, b.y + b.h - 1.5 * k, 2.2 * k, hex("#f9b4cf"), seed + 3);
    if (page) {
      rose(c.page, b.x + 4, b.y + 4, 4.5, hex("#e9558d"), seed + 4);
      rose(c.page, b.x + b.w - 4, b.y + 4, 4.5, hex("#e9558d"), seed + 5);
    }
  },
  header: "ribbon",
  headerColors: { fill: hex("#d81b60"), dark: hex("#7a0f3a"), text: W, sub: hex("#ffe08a") },
  headerDecor(c, s) {
    crown(c.page, s.x + s.w / 2, s.y - 1.2, 7, hex("#f2c14e"), hex("#d81b60"));
  },
  badge: { fill: hex("#fff3c4"), edge: hex("#c8921a") },
  emblem(c, cx, cy, r) {
    crown(c.page, cx, cy + r * 0.05, r * 1.35, hex("#f2c14e"), hex("#d81b60"));
  },
  frame: { fill: hex("#e8b23a"), stroke: hex("#9a6a10"), ring: hex("#fff3c4") },
  challenge: { fill: hex("#ffe6ef"), stroke: hex("#e48aae"), pill: hex("#d81b60"), pillDark: hex("#7a0f3a"), pillText: W },
  watermark(c, x, y, s) {
    heart(c.page, x, y, s * 0.5, faint(c, 0.4));
  },
  vignette: {
    start(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 7; i++) sparkle(c.page, b.x + 8 + i * 8, y + Math.sin(i * 1.1) * (b.h * 0.25), 1 + (i % 3) * 0.5, hex("#e8b23a"));
      castle(c.page, b.x + b.w - 13, b.y + b.h - 1, 18, Math.min(15, b.h * 0.9), hex("#f6d3e2"), hex("#9c4dcc"));
      gem(c.page, b.x + 9, y, 2.6, hex("#d81b60"));
    },
    rest(c, b) {
      const cy = b.y + b.h / 2;
      moon(c, b.x + 16, cy - 1, Math.min(6, b.h * 0.38), hex("#f2c14e"));
      for (const [dx, dy, s] of [[14, -0.3, 1.4], [24, 0.15, 1.1], [-8, 0.3, 1.2]] as const) star5(c.page, b.x + 16 + dx, cy + dy * b.h, s, hex("#e8b23a"));
      castle(c.page, b.x + b.w - 14, b.y + b.h - 1, 20, Math.min(15, b.h * 0.9), hex("#e7c5dc"), hex("#7b3fa6"));
    },
    trail(c, b) {
      const y = b.y + b.h / 2;
      dottedPath(c.page, { x: b.x + 6, y: y + 3 }, { x: b.x + 22, y: y - 9 }, { x: b.x + 42, y: y + 9 }, { x: b.x + b.w - 16, y: y }, hex("#d81b60"), 0.4, 1.7);
      for (const [dx, dy] of [[14, -2], [32, 4]] as const) heart(c.page, b.x + dx, y + dy, 1.6, hex("#e9558d"));
      mirror(c, b.x + b.w - 9, y - 1, Math.min(14, b.h * 0.85), hex("#e8b23a"), hex("#d9ecff"));
    },
    row(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 5; i++) {
        const x = b.x + 8 + i * ((b.w - 16) / 4);
        if (i % 2) gem(c.page, x, y, 2.2, hex("#9c4dcc"));
        else heart(c.page, x, y, 2.3, hex("#e9558d"));
      }
    },
    burst(c, sc) {
      // moldura de retrato do castelo
      const g = hex("#e8b23a");
      for (const [x, y, sx, sy] of [[sc.x - 1.5, sc.y - 1.5, 1, 1], [sc.x + sc.w + 1.5, sc.y - 1.5, -1, 1], [sc.x - 1.5, sc.y + sc.h + 1.5, 1, -1], [sc.x + sc.w + 1.5, sc.y + sc.h + 1.5, -1, -1]] as const) {
        c.page.drawLine({ start: pt(c.page, x, y), end: pt(c.page, x + sx * 7, y), thickness: mm(0.9), color: color(g) });
        c.page.drawLine({ start: pt(c.page, x, y), end: pt(c.page, x, y + sy * 7), thickness: mm(0.9), color: color(g) });
        circle(c.page, x, y, 1, { fill: g });
      }
      for (const [dx, dy, s] of [[-3, 0.3, 1.6], [sc.w + 3, 0.6, 1.8]] as const) sparkle(c.page, sc.x + dx, sc.y + sc.h * dy, s, g);
    },
    pair(c, b) {
      const cy = b.y + b.h * 0.6;
      boot(c.page, b.x + b.w * 0.32, cy, 1.5, hex("#f48fb1"));
      boot(c.page, b.x + b.w * 0.72, cy + 3, 1.5, hex("#e9558d"), -1);
      for (const [dx, dy] of [[0.2, 0.15], [0.55, 0.25], [0.85, 0.12]] as const) sparkle(c.page, b.x + b.w * dx, b.y + b.h * dy, 1.6, hex("#e8b23a"));
      crown(c.page, b.x + b.w * 0.52, b.y + b.h * 0.22, 8);
    },
    goal(c, x, y) {
      crown(c.page, x, y, 9.5);
      sparkle(c.page, x + 5.5, y - 4.5, 1.5, hex("#e8b23a"));
      sparkle(c.page, x - 5.5, y - 3, 1.1, hex("#e8b23a"));
    },
    accents(c, sc, seed) {
      rose(c.page, sc.x - 1, sc.y + sc.h - 1, 2.6, hex("#e9558d"), seed);
      rose(c.page, sc.x + sc.w + 1, sc.y + sc.h - 2, 2.2, hex("#f48fb1"), seed + 1);
    },
    map(c, b) {
      dottedPath(c.page, { x: b.x + 22, y: b.y + 24 }, { x: b.x + 50, y: b.y + 52 }, { x: b.x + 110, y: b.y + 55 }, { x: b.x + b.w - 20, y: b.y + 28 }, hex("#d81b60"), 0.5, 2);
      castle(c.page, b.x + 122, b.y + 56, 30, 26, hex("#f6d3e2"), hex("#9c4dcc"));
      crown(c.page, b.x + 14, b.y + 20, 14);
      crown(c.page, b.x + b.w - 10, b.y + 30, 10);
      xMark(c.page, b.x + b.w - 3, b.y + 38, 1.8, hex("#b0124d"));
      for (const [dx, dy] of [[40, 46], [150, 54], [60, 22]] as const) rose(c.page, b.x + dx, b.y + dy, 3, hex("#e9558d"), dx);
      for (const [dx, dy] of [[80, 18], [150, 50]] as const) heart(c.page, b.x + dx, b.y + dy, 2, hex("#f48fb1"));
    },
    certFooter(c, b) {
      for (let i = 0; i < 6; i++) rose(c.page, b.x + 10 + i * ((b.w - 20) / 5), b.y + b.h / 2, 2.8, i % 2 ? hex("#f48fb1") : hex("#e9558d"), i + 3);
    },
  },
  final: { frame: hex("#e8b23a"), frameDark: hex("#9a6a10"), rays: hex("#ffd1e2"), band: hex("#c2185b") },
  progress: hex("#d81b60"),
};

// ═══════════════════════════ FADAS ═══════════════════════════
const FOREST = hex("#24523f");
const FG = { light: hex("#4f8c4a"), mid: hex("#3b7139"), dark: hex("#2a5530") };
const fadas: ThemeStyle = {
  font: "Chewy-Regular.ttf",
  band: FOREST,
  bandDecor(c, o, seed) {
    const r = rng(seed);
    for (let y = o.y; y < o.y + o.h; y += 6) {
      bigLeaf(c.page, o.x - 1, y + r() * 3, 8 + r() * 4, -20 + r() * 40, FG, r() > 0.5 ? "mid" : "dark");
      bigLeaf(c.page, o.x + o.w + 1, y + r() * 3, 8 + r() * 4, 160 + r() * 40, FG, r() > 0.5 ? "mid" : "dark");
    }
    for (let x = o.x; x < o.x + o.w; x += 7) {
      bigLeaf(c.page, x, o.y - 1, 8 + r() * 3, 70 + r() * 40, FG, "dark");
      bigLeaf(c.page, x, o.y + o.h + 1, 8 + r() * 3, -70 - r() * 40, FG, "mid");
    }
    for (let i = 0; i < Math.round((o.w + o.h) / 14); i++) {
      const edge = r();
      const x = edge < 0.5 ? (r() < 0.5 ? o.x + 1.5 : o.x + o.w - 1.5) : o.x + r() * o.w;
      const y = edge < 0.5 ? o.y + r() * o.h : r() < 0.5 ? o.y + 1.5 : o.y + o.h - 1.5;
      glow(c.page, x, y, 1.2);
    }
  },
  sheet: { shape: "torn", fill: hex("#fdf8ea"), edge: hex("#cdb98a") },
  edgeDecor(c, o, b, seed, page) {
    const r = rng(seed);
    const k = page ? 1.6 : 1;
    const petals = [hex("#f48fc0"), hex("#c39bf0"), hex("#ffb26b"), hex("#ff8fa3")];
    for (const [x, y] of [[b.x + 2, b.y + b.h - 3], [b.x + 7, b.y + b.h - 1], [b.x + b.w - 2, b.y + b.h - 3], [b.x + b.w - 7, b.y + b.h - 1]] as const) {
      bigLeaf(c.page, x, y + 1, 6 * k, -60 - r() * 60, FG, "light");
      flower(c.page, x, y, 2.4 * k, petals[Math.floor(r() * 4)]);
    }
    butterfly(c.page, b.x + b.w - 6, b.y + 30 + r() * 20, 2.4 * k, hex("#c39bf0"), hex("#f48fc0"));
    if (page) {
      butterfly(c.page, b.x + 12, b.y + 70, 4, hex("#8fd0ff"), hex("#c39bf0"));
      for (const [x, y] of [[b.x + 4, b.y + 4], [b.x + b.w - 4, b.y + 4]] as const) flower(c.page, x, y, 4, petals[0]);
      mushroom(c.page, b.x + 14, b.y + b.h - 4, 12);
      mushroom(c.page, b.x + 24, b.y + b.h - 4, 8, hex("#b06ad8"));
    }
  },
  header: "plank",
  headerColors: { fill: hex("#8a5a2b"), dark: hex("#4d3015"), text: hex("#fff6e0"), sub: hex("#ffd1ea") },
  headerDecor(c, s) {
    flower(c.page, s.x + 0.5, s.y + 1, 2.6, hex("#f48fc0"));
    flower(c.page, s.x + s.w - 0.5, s.y + s.h - 1, 2.2, hex("#c39bf0"));
  },
  badge: { fill: hex("#ffe7f3"), edge: hex("#d6338a") },
  emblem(c, cx, cy, r) {
    flower(c.page, cx, cy, r * 0.8, hex("#f48fc0"));
    sparkle(c.page, cx + r * 0.75, cy - r * 0.75, r * 0.3, hex("#f2c14e"));
  },
  frame: { fill: hex("#8a5a2b"), stroke: hex("#4d3015"), ring: hex("#f2c14e") },
  challenge: { fill: hex("#f9eedf"), stroke: hex("#c79a6a"), pill: hex("#d6338a"), pillDark: hex("#7a1550"), pillText: W },
  watermark(c, x, y, s) {
    flower(c.page, x, y, s * 0.5, faint(c, 0.35), faint(c, 0.5));
  },
  vignette: {
    start(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 9; i++) {
        const x = b.x + 8 + i * 6.5;
        const yy = y + Math.sin(i * 0.9) * (b.h * 0.28);
        if (i % 2) glow(c.page, x, yy, 1.1, hex("#ffd1ea"));
        else sparkle(c.page, x, yy, 1.2, hex("#f2c14e"));
      }
      mushroom(c.page, b.x + b.w - 10, b.y + b.h - 1, Math.min(11, b.h * 0.85));
    },
    rest(c, b) {
      const cy = b.y + b.h / 2;
      moon(c, b.x + b.w - 16, cy - 1, Math.min(6, b.h * 0.38), hex("#f2c14e"));
      for (const [dx, dy] of [[-14, -0.25], [-24, 0.2], [6, 0.3], [-34, -0.1]] as const) glow(c.page, b.x + b.w - 16 + dx, cy + dy * b.h, 1.1);
      mushroom(c.page, b.x + 12, b.y + b.h - 1, Math.min(10, b.h * 0.8), hex("#b06ad8"));
    },
    trail(c, b) {
      const y = b.y + b.h / 2;
      dottedPath(c.page, { x: b.x + 6, y: y + 3 }, { x: b.x + 22, y: y - 9 }, { x: b.x + 42, y: y + 9 }, { x: b.x + b.w - 16, y: y }, hex("#d6338a"), 0.4, 1.7);
      for (const [dx, dy] of [[14, -2], [32, 4]] as const) sparkle(c.page, b.x + dx, y + dy, 1.5, hex("#f2c14e"));
      mirror(c, b.x + b.w - 9, y - 1, Math.min(14, b.h * 0.85), hex("#8a5a2b"), hex("#e6f3ff"));
      flower(c.page, b.x + b.w - 13, y - 6, 1.8, hex("#f48fc0"));
    },
    row(c, b) {
      const y = b.y + b.h / 2;
      wand(c.page, b.x + 4, y + 3, 10, -30, hex("#f2c14e"));
      for (let i = 0; i < 3; i++) star5(c.page, b.x + 26 + i * 14, y, 2.6, hex("#f2c14e"), { stroke: hex("#b98a10") });
    },
    burst(c, sc) {
      for (const [dx, dy, s] of [[-3, 0.2, 1.8], [-2, 0.75, 1.2], [sc.w + 3, 0.3, 2], [sc.w + 2, 0.8, 1.4]] as const) sparkle(c.page, sc.x + dx, sc.y + sc.h * dy, s, hex("#f2c14e"));
      for (const [dx, dy] of [[-4, 0.5], [sc.w + 4, 0.55]] as const) glow(c.page, sc.x + dx, sc.y + sc.h * dy, 1.3, hex("#ffd1ea"));
      butterfly(c.page, sc.x + sc.w - 3, sc.y - 2.5, 2.4, hex("#c39bf0"), hex("#f48fc0"));
    },
    pair(c, b) {
      wand(c.page, b.x + 6, b.y + b.h - 6, Math.min(18, b.h * 0.6), -55, hex("#f2c14e"));
      heart(c.page, b.x + b.w * 0.62, b.y + b.h * 0.6, 4, hex("#f48fc0"));
      butterfly(c.page, b.x + b.w * 0.75, b.y + b.h * 0.25, 2.6, hex("#8fd0ff"), hex("#c39bf0"));
    },
    goal(c, x, y) {
      // pote de pó mágico
      c.page.drawEllipse({ ...pt(c.page, x, y + 1), xScale: mm(3.8), yScale: mm(4.2), color: color(hex("#f7c6e4")), borderColor: color(hex("#b98a10")), borderWidth: mm(0.35) });
      c.page.drawRectangle({ ...pt(c.page, x - 2.2, y - 3), width: mm(4.4), height: mm(1.6), color: color(hex("#f2c14e")), borderColor: color(hex("#b98a10")), borderWidth: mm(0.2) });
      glow(c.page, x, y + 1, 1.6, hex("#ffd1ea"));
      sparkle(c.page, x + 4.5, y - 4.5, 1.4, hex("#f2c14e"));
    },
    accents(c, sc, seed) {
      mushroom(c.page, sc.x - 0.5, sc.y + sc.h + 1.5, 6);
      flower(c.page, sc.x + sc.w + 0.5, sc.y + sc.h - 1, 2.2, hex("#c39bf0"));
      void seed;
    },
    map(c, b) {
      dottedPath(c.page, { x: b.x + 22, y: b.y + 24 }, { x: b.x + 50, y: b.y + 52 }, { x: b.x + 110, y: b.y + 55 }, { x: b.x + b.w - 18, y: b.y + 28 }, hex("#d6338a"), 0.5, 2);
      for (const [dx, dy] of [[30, 34], [62, 50], [118, 52], [140, 40]] as const) glow(c.page, b.x + dx, b.y + dy, 1.4);
      mushroom(c.page, b.x + 14, b.y + 30, 16);
      mushroom(c.page, b.x + 130, b.y + 56, 9, hex("#b06ad8"));
      fadas.vignette.goal(c, b.x + b.w - 10, b.y + 26);
      xMark(c.page, b.x + b.w - 3, b.y + 34, 1.8, hex("#c2185b"));
    },
    certFooter(c, b) {
      const petals = [hex("#f48fc0"), hex("#c39bf0"), hex("#ffb26b")];
      for (let i = 0; i < 7; i++) flower(c.page, b.x + 10 + i * ((b.w - 20) / 6), b.y + b.h / 2 + (i % 2 ? -1.5 : 1.5), 2.6, petals[i % 3]);
    },
  },
  final: { frame: hex("#f2c14e"), frameDark: hex("#8a6a10"), rays: hex("#ffe1f2"), band: hex("#1b4433") },
  progress: hex("#d6338a"),
};

// ═══════════════════════════ SEREIAS ═══════════════════════════
const OCEAN = hex("#1e7fb0");
const sereias: ThemeStyle = {
  font: "BubblegumSans-Regular.ttf",
  band: OCEAN,
  bandDecor(c, o, seed) {
    const r = rng(seed);
    for (let y = o.y + 3; y < o.y + o.h; y += 5) waveLine(c.page, o.x, o.x + o.w, y, 0.6, hex("#5fb8e0"), 0.45, 0.35);
    for (let i = 0; i < Math.round((o.w + o.h) / 9); i++) {
      const side = r() < 0.5;
      const x = side ? (r() < 0.5 ? o.x + 1.5 + r() * 2 : o.x + o.w - 1.5 - r() * 2) : o.x + r() * o.w;
      const y = side ? o.y + r() * o.h : r() < 0.5 ? o.y + 1.5 : o.y + o.h - 1.5;
      bubble(c.page, x, y, 0.5 + r() * 0.9);
    }
  },
  sheet: { shape: "wavy", fill: hex("#fdf6e6"), edge: hex("#d9c08f") },
  edgeDecor(c, o, b, seed, page) {
    const k = page ? 1.7 : 1;
    seaweed(c.page, b.x + 2, b.y + b.h + 1, 12 * k, hex("#22a39a"), seed);
    seaweed(c.page, b.x + 5, b.y + b.h + 1, 9 * k, hex("#3cc0a5"), seed + 1);
    coral(c.page, b.x + b.w - 4, b.y + b.h + 1, 12 * k, hex("#f2709c"), seed + 2);
    starfish(c.page, b.x + b.w - 10 * k, b.y + b.h - 1, 2.4 * k, hex("#ff8a4c"), 12);
    for (let i = 0; i < (page ? 8 : 4); i++) bubble(c.page, b.x + b.w - 1 + (i % 2), b.y + 40 + i * (page ? 18 : 9), 0.9 + (i % 3) * 0.4);
    if (page) {
      shell(c.page, b.x + 6, b.y + 6, 5, hex("#f6a6c8"));
      starfish(c.page, b.x + b.w - 6, b.y + 6, 4.5, hex("#ff8a4c"), -10);
      fish(c.page, b.x + 16, b.y + 120, 2.6, hex("#ffd34d"), hex("#3a8be0"));
      starfish(c.page, b.x + b.w - 16, b.y + b.h - 4, 4, hex("#ff8a4c"), 25);
    }
  },
  header: "plank",
  headerColors: { fill: hex("#8a5a2b"), dark: hex("#4d3015"), text: hex("#fff6e0"), sub: hex("#ffd1e3") },
  headerDecor(c, s) {
    shell(c.page, s.x + 0.5, s.y + 2, 3, hex("#f6a6c8"));
    starfish(c.page, s.x + s.w - 0.5, s.y + s.h - 1.5, 2.4, hex("#ff8a4c"));
  },
  badge: { fill: hex("#ffe1ec"), edge: hex("#e0337f") },
  emblem(c, cx, cy, r) {
    shell(c.page, cx, cy, r * 0.75, hex("#f6a6c8"));
    pearl(c.page, cx, cy + r * 0.35, r * 0.22);
  },
  frame: { fill: hex("#2aa1a0"), stroke: hex("#0f5c5a"), ring: hex("#f2c14e") },
  challenge: { fill: hex("#ffe9f0"), stroke: hex("#e98bb2"), pill: hex("#e0337f"), pillDark: hex("#86154a"), pillText: W },
  watermark(c, x, y, s, rot) {
    starfish(c.page, x, y, s * 0.55, faint(c, 0.3), rot);
  },
  vignette: {
    start(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 6; i++) bubble(c.page, b.x + 8 + i * 9, y + Math.sin(i * 1.2) * (b.h * 0.25), 0.9 + (i % 3) * 0.45);
      shell(c.page, b.x + b.w - 10, y + 1, Math.min(5.5, b.h * 0.35), hex("#f6a6c8"));
      for (const [dx, dy] of [[-5, -4], [4, -5]] as const) sparkle(c.page, b.x + b.w - 10 + dx, y + dy, 1.4, hex("#f2c14e"));
    },
    rest(c, b) {
      const cy = b.y + b.h / 2;
      moon(c, b.x + 16, cy - 2, Math.min(5.5, b.h * 0.35), hex("#f2c14e"));
      waveLine(c.page, b.x + 6, b.x + b.w - 6, cy + b.h * 0.3, 0.8, hex("#5fb8e0"), 0.9, 0.5);
      for (const [dx, dy] of [[30, -0.1], [40, 0.15], [52, -0.2]] as const) bubble(c.page, b.x + dx, cy + dy * b.h, 1.1);
      starfish(c.page, b.x + b.w - 10, cy, Math.min(4, b.h * 0.25), hex("#ff8a4c"), 15);
    },
    trail(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 6; i++) bubble(c.page, b.x + 8 + i * 8.5, y + 3 - i * 0.6 + Math.sin(i) * 3, 0.9 + i * 0.15);
      mirror(c, b.x + b.w - 9, y - 1, Math.min(14, b.h * 0.85), hex("#f2c14e"), hex("#bfe6ff"));
      for (const a of [0, 1.2, 2.4, 3.6, 4.8]) pearl(c.page, b.x + b.w - 9 + Math.cos(a) * 4.6, y - 1 + Math.sin(a) * 5.8, 0.55);
    },
    row(c, b) {
      const y = b.y + b.h / 2;
      for (let i = 0; i < 5; i++) bubble(c.page, b.x + 8 + i * ((b.w - 16) / 4), y, 1.4 + i * 0.4);
    },
    burst(c, sc) {
      for (const [dx, dy, s] of [[-3, 0.2, 1.4], [-2.5, 0.65, 1], [sc.w + 3, 0.3, 1.6], [sc.w + 2.5, 0.75, 1.1], [sc.w * 0.5, -0.12, 1.2]] as const) bubble(c.page, sc.x + dx, sc.y + sc.h * dy, s);
      starfish(c.page, sc.x - 1, sc.y + sc.h, 2.6, hex("#ff8a4c"));
      shell(c.page, sc.x + sc.w + 1, sc.y + sc.h, 2.6, hex("#f6a6c8"));
    },
    pair(c, b) {
      fish(c.page, b.x + b.w * 0.4, b.y + b.h * 0.35, 2.6, hex("#ffd34d"), hex("#3a8be0"));
      for (let i = 0; i < 5; i++) bubble(c.page, b.x + b.w * 0.78, b.y + 3 + i * ((b.h - 6) / 4), 1.6 - i * 0.2);
      shell(c.page, b.x + b.w * 0.35, b.y + b.h * 0.78, 3.6, hex("#f6a6c8"));
    },
    goal(c, x, y) {
      chest(c.page, x, y + 1, 10);
    },
    accents(c, sc, seed) {
      coral(c.page, sc.x - 0.5, sc.y + sc.h + 2, 7, hex("#f2709c"), seed);
      starfish(c.page, sc.x + sc.w, sc.y + sc.h + 0.5, 2.2, hex("#ff8a4c"), 20);
      bubble(c.page, sc.x + sc.w + 1, sc.y + 3, 1);
    },
    map(c, b) {
      waveLine(c.page, b.x + 8, b.x + b.w - 8, b.y + 6, 1, hex("#5fb8e0"), 0.9, 0.5);
      dottedPath(c.page, { x: b.x + 22, y: b.y + 24 }, { x: b.x + 50, y: b.y + 52 }, { x: b.x + 110, y: b.y + 55 }, { x: b.x + b.w - 20, y: b.y + 28 }, hex("#e0337f"), 0.5, 2);
      shell(c.page, b.x + 14, b.y + 24, 7, hex("#f6a6c8"));
      fish(c.page, b.x + 50, b.y + 30, 2.4, hex("#ffd34d"), hex("#3a8be0"));
      seaweed(c.page, b.x + 132, b.y + 58, 16, hex("#22a39a"), 3);
      coral(c.page, b.x + 40, b.y + 58, 12, hex("#f2709c"), 4);
      chest(c.page, b.x + b.w - 14, b.y + 28, 16);
      xMark(c.page, b.x + b.w - 4, b.y + 40, 1.8, hex("#c2185b"));
    },
    certFooter(c, b) {
      for (let i = 0; i < 7; i++) {
        const x = b.x + 10 + i * ((b.w - 20) / 6);
        if (i % 3 === 0) shell(c.page, x, b.y + b.h / 2, 3, hex("#f6a6c8"));
        else if (i % 3 === 1) starfish(c.page, x, b.y + b.h / 2, 2.6, hex("#ff8a4c"), i * 10);
        else pearl(c.page, x, b.y + b.h / 2, 1.6);
      }
    },
  },
  final: { frame: hex("#f2c14e"), frameDark: hex("#8a6a10"), rays: hex("#c8f1ff"), band: hex("#13618a") },
  progress: hex("#e0337f"),
};

export const STYLES: Partial<Record<ThemeId, ThemeStyle>> = { espaco, futebol, princesas, fadas, sereias };

void blobPoints;
