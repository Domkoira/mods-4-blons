/**
 * Renders the placeholder photography in /public/images.
 *
 * Every image is an HTML/CSS/SVG "studio scene" screenshotted with headless
 * Chromium, so the storefront looks finished before real photography exists.
 * Swap the files (or the paths in src/data) for real photos when ready.
 *
 *   npm run images
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public", "images");

const C = {
  ivory: "#F5F3EE",
  navy: "#101A1C",
  ocean: "#173A42",
  seafoam: "#86AAA0",
  sand: "#D8CBB8",
};

// ---------- shared pieces ----------

const grain = (opacity = 0.18, freq = 0.9) => `
<svg class="grain" style="position:absolute;inset:0;width:100%;height:100%;opacity:${opacity};mix-blend-mode:overlay;pointer-events:none">
  <filter id="g${freq}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#g${freq})"/>
</svg>`;

const page = (w, h, body, extraCss = "") => `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family: Serif; src: local("Cormorant Garamond"), local("Georgia"); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body { position: relative; font-family: "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .scene { position: absolute; inset: 0; overflow: hidden; }
  .abs { position: absolute; }
  .serif { font-family: Georgia, "Times New Roman", serif; font-weight: 400; }
  .track { letter-spacing: .32em; text-transform: uppercase; }
  ${extraCss}
</style></head><body>${body}</body></html>`;

/** Seamless studio sweep with a soft key light. */
const studio = (wallTop, wallBottom, floor, light = "rgba(255,255,255,.55)") => `
<div class="abs" style="inset:0;background:linear-gradient(180deg, ${wallTop} 0%, ${wallBottom} 58%, ${floor} 100%)"></div>
<div class="abs" style="left:-10%;right:-10%;top:-20%;height:90%;background:radial-gradient(ellipse at 40% 45%, ${light}, transparent 60%)"></div>
<div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 120%, rgba(0,0,0,.12), transparent 55%)"></div>`;

/** Sunlit stone/sand surface with a palm-frond shadow. */
const sunlit = (base, tint, seed = 4) => `
<div class="abs" style="inset:0;background:${base}"></div>
<svg class="abs" style="inset:0;width:100%;height:100%;mix-blend-mode:multiply;opacity:.55">
  <filter id="stone${seed}"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="5" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .44  0 0 0 -1.6 1.25"/></filter>
  <rect width="100%" height="100%" filter="url(#stone${seed})"/>
</svg>
<div class="abs" style="inset:0;background:linear-gradient(115deg, ${tint} 0%, transparent 55%, rgba(0,0,0,.18) 100%)"></div>
${frondShadow()}`;

function frondShadow(opacity = 0.32, x = -120, y = -160, rot = 28, scale = 1.25) {
  // A palm frond: a curved rachis with tapering leaflets either side.
  let leaflets = "";
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const px = 80 + t * 900;
    const py = 120 + Math.sin(t * 1.8) * 140;
    const len = 260 * Math.sin(Math.PI * (0.12 + t * 0.8)) + 40;
    const a1 = -62 + t * 18;
    const a2 = 62 - t * 18;
    leaflets += `<path d="M${px},${py} q ${len * 0.35},-14 ${len},-4 q -${len * 0.6},18 -${len},4 z" transform="rotate(${a1} ${px} ${py})"/>`;
    leaflets += `<path d="M${px},${py} q ${len * 0.35},14 ${len},4 q -${len * 0.6},-18 -${len},-4 z" transform="rotate(${a2} ${px} ${py})"/>`;
  }
  return `<svg class="abs" viewBox="0 0 1100 700" style="left:${x}px;top:${y}px;width:${1100 * scale}px;transform:rotate(${rot}deg);opacity:${opacity};filter:blur(7px);mix-blend-mode:multiply">
    <g fill="#1c1a16">
      <path d="M60,130 Q 520,-40 1060,250" stroke="#1c1a16" stroke-width="10" fill="none"/>
      ${leaflets}
    </g></svg>`;
}

/** Soft contact + cast shadow under an object. */
const shadow = (cx, y, w, cast = 0, castColor = "rgba(30,24,16,.35)") => `
<div class="abs" style="left:${cx - w / 2}px;top:${y - 22}px;width:${w}px;height:44px;border-radius:50%;background:rgba(0,0,0,.42);filter:blur(16px)"></div>
<div class="abs" style="left:${cx - w * 0.3}px;top:${y - 10}px;width:${w * 0.6}px;height:20px;border-radius:50%;background:rgba(0,0,0,.55);filter:blur(6px)"></div>
${cast ? `<div class="abs" style="left:${cx - w / 2 + 40}px;top:${y - 60}px;width:${w * 0.9}px;height:${cast}px;border-radius:40% 40% 50% 50%;background:${castColor};filter:blur(18px);transform-origin:50% 0;transform:skewX(-52deg) scaleY(.55)"></div>` : ""}`;

/** Cylinder shading overlay for any rounded object. */
const cyl = (strength = 1) => `linear-gradient(90deg,
  rgba(0,0,0,${0.42 * strength}) 0%, rgba(0,0,0,${0.12 * strength}) 14%, rgba(255,255,255,${0.1 * strength}) 30%,
  rgba(255,255,255,${0.22 * strength}) 36%, rgba(255,255,255,${0.04 * strength}) 48%, rgba(0,0,0,${0.06 * strength}) 70%,
  rgba(0,0,0,${0.38 * strength}) 92%, rgba(0,0,0,${0.55 * strength}) 100%)`;

// ---------- products ----------

/** Matte ceramic jar with lid and wrapped label. */
function jar({ cx, bottom, w = 420, h = 470, body, lid, label, ink, name, line, size, batch }) {
  const lidH = Math.round(h * 0.24);
  const left = cx - w / 2;
  const top = bottom - h;
  return `
  ${shadow(cx, bottom, w * 1.05)}
  <div class="abs" style="left:${left}px;top:${top + lidH - 10}px;width:${w}px;height:${h - lidH + 10}px;border-radius:26px 26px 46px 46px / 18px 18px 40px 40px;background:${body};overflow:hidden">
    <div class="abs" style="left:0;right:0;top:${(h - lidH) * 0.2}px;height:${(h - lidH) * 0.6}px;background:${label};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ink};text-align:center">
      <div class="track" style="font-size:${w * 0.032}px;font-weight:600;opacity:.85">Tidal Hemp</div>
      <div style="width:${w * 0.09}px;height:1px;background:${ink};opacity:.5;margin:${w * 0.03}px 0"></div>
      <div class="serif" style="font-size:${w * 0.105}px;line-height:1;letter-spacing:.01em">${name}</div>
      <div class="track" style="font-size:${w * 0.024}px;margin-top:${w * 0.035}px;opacity:.75">${line}</div>
      <div class="track" style="font-size:${w * 0.022}px;margin-top:${w * 0.05}px;opacity:.55">${size} &nbsp;·&nbsp; ${batch}</div>
    </div>
    <div class="abs" style="inset:0;background:${cyl(1)}"></div>
    <div class="abs" style="left:31%;top:0;bottom:0;width:4%;background:rgba(255,255,255,.18);filter:blur(10px)"></div>
  </div>
  <div class="abs" style="left:${left - 8}px;top:${top}px;width:${w + 16}px;height:${lidH}px;border-radius:18px 18px 10px 10px / 14px 14px 8px 8px;background:${lid};overflow:hidden">
    <div class="abs" style="inset:0;background:repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 3px, rgba(0,0,0,.05) 3px 6px)"></div>
    <div class="abs" style="inset:0;background:${cyl(1.1)}"></div>
    <div class="abs" style="left:0;right:0;top:0;height:10px;background:linear-gradient(180deg, rgba(255,255,255,.25), transparent)"></div>
  </div>`;
}

/** Slim vape device. */
function vape({ cx, bottom, h = 560, w = 104, body, tip, accent, rot = 0 }) {
  const left = cx - w / 2;
  return `
  ${shadow(cx, bottom, w * 2.2)}
  <div class="abs" style="left:${left}px;top:${bottom - h}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg);transform-origin:50% 100%">
    <div class="abs" style="left:${w * 0.18}px;top:0;width:${w * 0.64}px;height:${h * 0.16}px;border-radius:${w * 0.3}px ${w * 0.3}px 6px 6px;background:${tip};overflow:hidden">
      <div class="abs" style="inset:0;background:${cyl(0.9)}"></div>
    </div>
    <div class="abs" style="left:0;top:${h * 0.15}px;width:${w}px;height:${h * 0.85}px;border-radius:${w * 0.22}px ${w * 0.22}px ${w * 0.3}px ${w * 0.3}px;background:${body};overflow:hidden">
      <div class="abs" style="left:0;right:0;top:${h * 0.06}px;height:${h * 0.03}px;background:${accent};opacity:.9"></div>
      <div class="abs track" style="left:50%;top:${h * 0.42}px;transform:translate(-50%,-50%) rotate(-90deg);font-size:${w * 0.17}px;color:rgba(245,243,238,.7);white-space:nowrap;font-weight:600">Tidal Hemp</div>
      <div class="abs" style="left:50%;bottom:${h * 0.07}px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:${accent};box-shadow:0 0 12px ${accent}"></div>
      <div class="abs" style="inset:0;background:${cyl(1)}"></div>
      <div class="abs" style="left:30%;top:0;bottom:0;width:7%;background:rgba(255,255,255,.2);filter:blur(5px)"></div>
    </div>
  </div>`;
}

/** 3D carton built from CSS faces. */
function carton({ cx, bottom, w = 300, h = 440, d = 90, face, side, top: topC, ink, name, line, size, ry = -28 }) {
  return `
  ${shadow(cx + 10, bottom, w * 1.25)}
  <div class="abs" style="left:${cx - w / 2}px;top:${bottom - h}px;width:${w}px;height:${h}px;perspective:2400px">
    <div style="position:relative;width:${w}px;height:${h}px;transform-style:preserve-3d;transform:rotateX(-6deg) rotateY(${ry}deg)">
      <div class="abs" style="inset:0;background:${face};transform:translateZ(${d / 2}px);display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ink};text-align:center;overflow:hidden">
        <div class="track" style="font-size:${w * 0.042}px;font-weight:600;opacity:.85">Tidal Hemp</div>
        <div style="width:30px;height:1px;background:${ink};opacity:.5;margin:${w * 0.05}px 0"></div>
        <div class="serif" style="font-size:${w * 0.14}px;line-height:1">${name}</div>
        <div class="track" style="font-size:${w * 0.032}px;margin-top:${w * 0.05}px;opacity:.75">${line}</div>
        <div class="track abs" style="bottom:${w * 0.09}px;font-size:${w * 0.03}px;opacity:.55">${size}</div>
        <div class="abs" style="inset:0;background:linear-gradient(100deg, rgba(255,255,255,.14), transparent 40%, rgba(0,0,0,.08))"></div>
      </div>
      <div class="abs" style="top:0;left:${(w - d) / 2}px;width:${d}px;height:${h}px;background:${side};transform:rotateY(90deg) translateZ(${w / 2}px)">
        <div class="abs" style="inset:0;background:linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.12))"></div>
      </div>
      <div class="abs" style="left:0;top:${(h - d) / 2}px;width:${w}px;height:${d}px;background:${topC};transform:rotateX(90deg) translateZ(${h / 2}px)"></div>
    </div>
  </div>`;
}

/** Shallow round tin, seen from slightly above. */
function tin({ cx, bottom, w = 440, side = 92, body, lid, ink, name, line }) {
  const eh = w * 0.34;
  const left = cx - w / 2;
  const top = bottom - side - eh / 2;
  return `
  ${shadow(cx, bottom, w * 1.05)}
  <div class="abs" style="left:${left}px;top:${top}px;width:${w}px;height:${side + eh / 2}px;border-radius:0 0 50% 50% / 0 0 ${eh / 2}px ${eh / 2}px;background:${body};overflow:hidden">
    <div class="abs" style="inset:0;background:${cyl(1)}"></div>
    <div class="abs" style="left:0;right:0;top:${side * 0.28}px;height:2px;background:rgba(0,0,0,.25)"></div>
  </div>
  <div class="abs" style="left:${left}px;top:${top - eh / 2}px;width:${w}px;height:${eh}px;border-radius:50%;background:${lid};overflow:hidden;box-shadow:inset 0 -6px 10px rgba(0,0,0,.18), inset 0 4px 8px rgba(255,255,255,.25)">
    <div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ink};transform:scaleY(.62)">
      <div class="track" style="font-size:${w * 0.03}px;font-weight:600;opacity:.8">Tidal Hemp</div>
      <div class="serif" style="font-size:${w * 0.1}px;line-height:1.05;margin-top:6px">${name}</div>
      <div class="track" style="font-size:${w * 0.022}px;margin-top:8px;opacity:.7">${line}</div>
    </div>
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 35% 30%, rgba(255,255,255,.3), transparent 50%)"></div>
  </div>`;
}

/** Glass dropper bottle. */
function dropper({ cx, bottom, w = 210, h = 520, glass, label, ink, name, line, size }) {
  const bodyH = h * 0.62;
  const left = cx - w / 2;
  return `
  ${shadow(cx, bottom, w * 1.3)}
  <div class="abs" style="left:${left}px;top:${bottom - bodyH}px;width:${w}px;height:${bodyH}px;border-radius:${w * 0.28}px ${w * 0.28}px 22px 22px / ${w * 0.2}px ${w * 0.2}px 18px 18px;background:${glass};overflow:hidden">
    <div class="abs" style="left:0;right:0;top:${bodyH * 0.3}px;height:${bodyH * 0.52}px;background:${label};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ink};text-align:center">
      <div class="track" style="font-size:${w * 0.055}px;font-weight:600;opacity:.85">Tidal Hemp</div>
      <div class="serif" style="font-size:${w * 0.16}px;line-height:1;margin-top:${w * 0.06}px">${name}</div>
      <div class="track" style="font-size:${w * 0.042}px;margin-top:${w * 0.06}px;opacity:.7">${line}</div>
      <div class="track" style="font-size:${w * 0.04}px;margin-top:${w * 0.05}px;opacity:.55">${size}</div>
    </div>
    <div class="abs" style="inset:0;background:${cyl(1.1)}"></div>
    <div class="abs" style="left:24%;top:4%;bottom:6%;width:6%;border-radius:20px;background:rgba(255,255,255,.35);filter:blur(4px)"></div>
  </div>
  <div class="abs" style="left:${cx - w * 0.26}px;top:${bottom - bodyH - h * 0.13}px;width:${w * 0.52}px;height:${h * 0.15}px;border-radius:6px;background:#141b1d;overflow:hidden">
    <div class="abs" style="inset:0;background:repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 5px)"></div>
    <div class="abs" style="inset:0;background:${cyl(1)}"></div>
  </div>
  <div class="abs" style="left:${cx - w * 0.17}px;top:${bottom - h}px;width:${w * 0.34}px;height:${h * 0.27}px;border-radius:${w * 0.17}px ${w * 0.17}px 10px 10px;background:#1b2224;overflow:hidden">
    <div class="abs" style="inset:0;background:${cyl(1.2)}"></div>
  </div>`;
}

function gummies(list) {
  return list
    .map(
      ([x, y, r, col]) => `
  <div class="abs" style="left:${x}px;top:${y}px;width:64px;height:58px;border-radius:18px;transform:rotate(${r}deg);background:radial-gradient(ellipse at 35% 30%, rgba(255,255,255,.6), ${col} 45%, rgba(0,0,0,.25));box-shadow:0 10px 14px rgba(0,0,0,.25), inset 0 -4px 8px rgba(0,0,0,.2)">
    <svg style="position:absolute;inset:0;width:100%;height:100%;border-radius:18px;opacity:.5;mix-blend-mode:screen"><filter id="s${x}"><feTurbulence baseFrequency="1.6" numOctaves="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -2.2 1.1"/></filter><rect width="100%" height="100%" filter="url(#s${x})"/></svg>
  </div>`
    )
    .join("");
}

// ---------- environment scenes ----------

function ocean({ w, h, horizon = 0.38, seed = 7, sun = "62%", mood = "dusk" }) {
  const sky =
    mood === "dusk"
      ? `linear-gradient(180deg, #0f1c20 0%, #1d363c 45%, #5f7a76 82%, #c9bfa9 100%)`
      : `linear-gradient(180deg, #8fa7a3 0%, #b9c4bb 60%, #e6dccb 100%)`;
  const hy = h * horizon;
  return `
  <div class="abs" style="left:0;right:0;top:0;height:${hy + 4}px;background:${sky}"></div>
  <div class="abs" style="left:calc(${sun} - 400px);top:${hy - 380}px;width:800px;height:520px;border-radius:50%;background:radial-gradient(ellipse, rgba(240,226,200,.55), rgba(240,226,200,.12) 45%, transparent 70%)"></div>
  <div class="abs" style="left:0;right:0;top:${hy}px;bottom:0;background:${mood === "dusk" ? "linear-gradient(180deg, #4b6764 0%, #1d3a40 18%, #102428 55%, #0a1517 100%)" : "linear-gradient(180deg, #9db3ad 0%, #5d7f7c 25%, #33575a 70%, #23403f 100%)"}"></div>
  <div class="abs" style="left:-50%;width:200%;top:${hy}px;height:${h * 2.2}px;transform-origin:50% 0;transform:perspective(${h * 0.9}px) rotateX(72deg)">
    <svg style="width:100%;height:100%">
      <filter id="w${seed}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.011" numOctaves="5" seed="${seed}" result="n"/>
        <feSpecularLighting in="n" surfaceScale="9" specularConstant="1.05" specularExponent="26" lighting-color="#f1e6cf" result="s">
          <feDistantLight azimuth="270" elevation="18"/>
        </feSpecularLighting>
        <feComposite in="s" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"/>
      </filter>
      <rect width="100%" height="100%" fill="#000" filter="url(#w${seed})"/>
    </svg>
  </div>
  <div class="abs" style="left:0;right:0;top:${hy}px;bottom:0;mix-blend-mode:multiply;background:${mood === "dusk" ? "linear-gradient(180deg, #c9cfc4 0%, #6e8c88 25%, #2b4c52 100%)" : "linear-gradient(180deg, #f1ede4 0%, #b9cbc5 30%, #6f918d 100%)"}"></div>
  <div class="abs" style="left:calc(${sun} - 260px);top:${hy - 40}px;width:520px;height:${(h - hy) * 0.9}px;background:radial-gradient(ellipse 50% 60% at 50% 0%, rgba(246,230,200,.5), rgba(246,230,200,.12) 55%, transparent 80%);filter:blur(40px);mix-blend-mode:screen"></div>
  <div class="abs" style="left:0;right:0;top:${hy - 30}px;height:70px;background:linear-gradient(180deg, transparent, rgba(200,196,180,.35), transparent);filter:blur(10px)"></div>
  <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(5,12,14,${mood === "dusk" ? 0.55 : 0.25}) 100%)"></div>`;
}

// ---------- catalogue of renders ----------

const S = 1200; // product canvas width
const PH = 1500; // product canvas height

const productLooks = {
  "tidal-reserve": {
    kind: "jar",
    props: { body: "#173A42", lid: "#101A1C", label: "#F5F3EE", ink: "#101A1C", name: "Tidal Reserve", line: "Premium THCA Flower", size: "3.5G", batch: "BATCH TR-0926" },
    studio: ["#d9d6cf", "#e9e6df", "#cfcac0"],
    sunlit: ["#cbbca5", "rgba(255,236,205,.35)"],
  },
  "coastal-reserve": {
    kind: "jar",
    props: { body: "#ECE7DD", lid: "#D8CBB8", label: "#173A42", ink: "#F5F3EE", name: "Coastal Reserve", line: "Premium Hemp Flower", size: "3.5G", batch: "BATCH CR-1004" },
    studio: ["#b7c7c1", "#cbd6d1", "#aebfb9"],
    sunlit: ["#c7bba8", "rgba(255,240,215,.4)"],
  },
  undertow: {
    kind: "jar",
    props: { body: "#121a1c", lid: "#0b1113", label: "#121a1c", ink: "#D8CBB8", name: "Undertow", line: "Reserve THCA Flower", size: "3.5G", batch: "BATCH UT-0001" },
    studio: ["#2a3a3d", "#3b4c4e", "#1f2c2e"],
    sunlit: ["#b9ab95", "rgba(255,230,200,.3)"],
    light: "rgba(160,190,180,.35)",
  },
  "deep-current": {
    kind: "vape",
    props: { body: "#173A42", tip: "#86AAA0", accent: "#86AAA0" },
    box: { face: "#173A42", side: "#10292f", top: "#1d4650", ink: "#F5F3EE", name: "Deep Current", line: "Premium Hemp Vape", size: "1.0ML · 1G" },
    studio: ["#cfd2cc", "#e2e2dc", "#c3c4bc"],
    sunlit: ["#c4b6a0", "rgba(255,236,205,.35)"],
  },
  riptide: {
    kind: "vape",
    props: { body: "#101A1C", tip: "#D8CBB8", accent: "#D8CBB8" },
    box: { face: "#101A1C", side: "#0a1113", top: "#18252a", ink: "#D8CBB8", name: "Riptide", line: "Limited Hemp Vape", size: "2.0ML · 2G" },
    studio: ["#c7bba8", "#d9cfbf", "#b9ad99"],
    sunlit: ["#c8bba6", "rgba(255,236,205,.35)"],
  },
  afterglow: {
    kind: "tin",
    props: { body: "#D8CBB8", lid: "#e7ddcf", ink: "#173A42", name: "Afterglow", line: "Hemp Gummies · 20 ct" },
    gummies: "#d9925f",
    studio: ["#e3d7c6", "#efe6da", "#d6c9b6"],
    sunlit: ["#cdbfa9", "rgba(255,226,190,.4)"],
  },
  "marine-layer": {
    kind: "tin",
    props: { body: "#86AAA0", lid: "#9db9b0", ink: "#101A1C", name: "Marine Layer", line: "Evening Gummies · 20 ct" },
    gummies: "#6f8fb1",
    studio: ["#c9d3cf", "#dde3df", "#bcc8c3"],
    sunlit: ["#c4b8a4", "rgba(230,240,240,.35)"],
  },
  "slack-water": {
    kind: "dropper",
    props: { glass: "linear-gradient(180deg,#3c2a1b,#5a3a20)", label: "#F5F3EE", ink: "#101A1C", name: "Slack Water", line: "Full Spectrum Oil", size: "30ML · 1500MG" },
    studio: ["#d6d0c4", "#e7e2d8", "#cbc4b7"],
    sunlit: ["#c9bba4", "rgba(255,232,200,.4)"],
  },
  "sea-glass": {
    kind: "dropper",
    props: { glass: "linear-gradient(180deg,#1e3b40,#2c5157)", label: "#D8CBB8", ink: "#101A1C", name: "Sea Glass", line: "Broad Spectrum Oil", size: "30ML · 1000MG" },
    studio: ["#c4d0cc", "#d9e1dd", "#b6c3be"],
    sunlit: ["#c6b9a4", "rgba(230,245,240,.35)"],
  },
  "low-tide": {
    kind: "carton",
    props: { face: "#F5F3EE", side: "#d9d3c7", top: "#ffffff", ink: "#173A42", name: "Low Tide", line: "Pre-Roll Pack · 5 × 0.7G", size: "3.5G TOTAL" },
    studio: ["#9fb3ad", "#b8c8c2", "#8fa49e"],
    sunlit: ["#c9bca7", "rgba(255,236,205,.35)"],
  },
  "morning-swell": {
    kind: "carton",
    props: { face: "#D8CBB8", side: "#bfb19c", top: "#e4d9c9", ink: "#101A1C", name: "Morning Swell", line: "Daytime Pre-Roll · 2 × 1G", size: "2G TOTAL" },
    studio: ["#d4dad6", "#e6eae7", "#c7cdc9"],
    sunlit: ["#cdbfa9", "rgba(255,236,205,.4)"],
  },
  ebb: {
    kind: "tin",
    props: { body: "#101A1C", lid: "#1b2729", ink: "#D8CBB8", name: "Ebb", line: "Recovery Balm · 2 oz" },
    studio: ["#d8d2c6", "#e8e3d9", "#cbc4b7"],
    sunlit: ["#c8baa4", "rgba(255,232,200,.4)"],
  },
};

function productObject(look, cx, bottom, scale = 1) {
  const p = look.props;
  if (look.kind === "jar") return jar({ cx, bottom, w: 440 * scale, h: 500 * scale, ...p });
  if (look.kind === "vape")
    return (
      carton({ cx: cx - 130 * scale, bottom: bottom - 20, w: 300 * scale, h: 460 * scale, d: 96 * scale, ...look.box, ry: -24 }) +
      vape({ cx: cx + 170 * scale, bottom: bottom + 30, h: 560 * scale, w: 100 * scale, ...p })
    );
  if (look.kind === "tin") {
    const g = look.gummies
      ? gummies([
          [cx - 300, bottom + 40, -14, look.gummies],
          [cx - 200, bottom + 90, 22, look.gummies],
          [cx + 230, bottom + 70, 8, look.gummies],
        ])
      : "";
    return tin({ cx, bottom, w: 500 * scale, side: 110 * scale, ...p }) + g;
  }
  if (look.kind === "dropper") return dropper({ cx, bottom, w: 240 * scale, h: 600 * scale, ...p });
  if (look.kind === "carton") return carton({ cx, bottom, w: 360 * scale, h: 520 * scale, d: 120 * scale, ...p });
  return "";
}

const zoom = (html, originY, k) => `<div class="abs" style="inset:0;transform:scale(${k});transform-origin:50% ${originY}px">${html}</div>`;

function productStudio(slug) {
  const L = productLooks[slug];
  const [a, b, c] = L.studio;
  return page(S, PH, `<div class="scene">${studio(a, b, c, L.light)}${zoom(productObject(L, S / 2, PH * 0.7), PH * 0.7, 1.4)}${grain(0.14)}</div>`);
}

function productSunlit(slug) {
  const L = productLooks[slug];
  const [base, tint] = L.sunlit;
  return page(S, PH, `<div class="scene">${sunlit(base, tint, slug.length)}${zoom(productObject(L, S / 2, PH * 0.7), PH * 0.7, 1.4)}${frondShadow(0.22, 300, 700, -20, 0.9)}${grain(0.16)}</div>`);
}

function productDetail(slug) {
  const L = productLooks[slug];
  const [a, b, c] = L.studio;
  return page(
    S,
    PH,
    `<div class="scene"><div class="abs" style="inset:0;transform:scale(2.05);transform-origin:50% 52%">${studio(a, b, c, L.light)}${productObject(L, S / 2, PH * 0.74)}</div>${grain(0.16)}</div>`
  );
}

// Editorial / environment images
const editorial = {
  "hero-tide": () =>
    page(2400, 1400, `<div class="scene">${ocean({ w: 2400, h: 1400, horizon: 0.42, seed: 7, sun: "70%" })}${grain(0.2)}</div>`),
  "hero-tide-mobile": () =>
    page(1000, 1600, `<div class="scene">${ocean({ w: 1000, h: 1600, horizon: 0.24, seed: 9, sun: "60%" })}${grain(0.2)}</div>`),
  "private-access": () =>
    page(
      1600,
      1200,
      `<div class="scene">
        <div class="abs" style="inset:0;background:#0d2125"></div>
        <svg class="abs" style="inset:0;width:100%;height:100%">
          <filter id="surf" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0085" numOctaves="5" seed="21" result="n"/>
            <feSpecularLighting in="n" surfaceScale="14" specularConstant=".9" specularExponent="18" lighting-color="#cfe0d8" result="s">
              <feDistantLight azimuth="235" elevation="38"/>
            </feSpecularLighting>
            <feComposite in="s" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"/>
          </filter>
          <rect width="100%" height="100%" fill="#000" filter="url(#surf)"/>
        </svg>
        <div class="abs" style="inset:0;mix-blend-mode:multiply;background:linear-gradient(160deg,#6f948c,#2a5057 45%,#173A42)"></div>
        <div class="abs" style="inset:0;background:radial-gradient(ellipse at 70% 30%, rgba(216,203,184,.18), transparent 55%), radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(6,14,16,.6))"></div>
        ${grain(0.2)}</div>`
    ),
  "shoreline": () => page(2400, 1200, `<div class="scene">${ocean({ w: 2400, h: 1200, horizon: 0.5, seed: 13, sun: "50%", mood: "day" })}${grain(0.16)}</div>`),
  "about-editorial": () =>
    page(
      1200,
      1500,
      `<div class="scene">${sunlit("#cbbca5", "rgba(255,232,200,.45)", 9)}
       <div class="abs" style="left:250px;top:1000px;width:700px;height:360px;background:linear-gradient(180deg,#b8a990,#a3937a);border-radius:6px;box-shadow:0 40px 60px rgba(0,0,0,.25)">
         <div class="abs" style="inset:0;background:linear-gradient(90deg, rgba(0,0,0,.15), rgba(255,255,255,.12) 40%, rgba(0,0,0,.2))"></div>
         <div class="abs" style="left:0;right:0;top:0;height:40px;background:linear-gradient(180deg,#d4c6ae,#c2b49b)"></div>
       </div>
       ${jar({ cx: 600, bottom: 1030, w: 380, h: 440, ...productLooks["tidal-reserve"].props })}
       ${frondShadow(0.34, -200, 300, 18, 1.4)}${grain(0.18)}</div>`
    ),
  "quality-lab": () => {
    let vials = "";
    const cols = ["#86AAA0", "#D8CBB8", "#a9c2ba", "#c9b79c", "#86AAA0", "#D8CBB8", "#9fb8b0"];
    for (let i = 0; i < 7; i++) {
      const x = 150 + i * 190;
      const fill = 200 + (i % 3) * 40;
      vials += `
      <div class="abs" style="left:${x}px;top:520px;width:96px;height:560px;border-radius:12px 12px 48px 48px;background:linear-gradient(90deg, rgba(255,255,255,.18), rgba(255,255,255,.04) 30%, rgba(255,255,255,.12) 70%, rgba(255,255,255,.28));border:1px solid rgba(255,255,255,.25);overflow:hidden">
        <div class="abs" style="left:0;right:0;bottom:0;height:${fill}px;background:linear-gradient(90deg, ${cols[i]}cc, ${cols[i]}88 40%, ${cols[i]}cc);"></div>
        <div class="abs" style="left:18%;top:4%;bottom:6%;width:10%;background:rgba(255,255,255,.4);filter:blur(3px);border-radius:10px"></div>
      </div>
      <div class="abs" style="left:${x - 6}px;top:490px;width:108px;height:46px;border-radius:8px;background:#0b1214;box-shadow:inset 0 -4px 6px rgba(255,255,255,.06)"></div>`;
    }
    return page(
      1600,
      1200,
      `<div class="scene">${studio("#0f1c1f", "#173A42", "#0d1719", "rgba(134,170,160,.25)")}
       ${vials}
       <div class="abs" style="left:80px;right:80px;top:1010px;height:120px;background:linear-gradient(180deg,#2a3f43,#122023 40%,#0b1416);border-radius:6px;box-shadow:0 40px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12)"></div>
       <div class="abs" style="left:80px;right:80px;top:1050px;height:160px;background:linear-gradient(180deg,rgba(134,170,160,.08),transparent)"></div>
       ${grain(0.2)}</div>`
    );
  },
  "collection-banner": () =>
    page(
      2400,
      900,
      `<div class="scene">${studio("#d8d4cb", "#e8e5de", "#d0cbc1")}
       ${jar({ cx: 760, bottom: 720, w: 300, h: 340, ...productLooks["tidal-reserve"].props })}
       ${dropper({ cx: 1040, bottom: 720, w: 170, h: 430, ...productLooks["slack-water"].props })}
       ${tin({ cx: 1340, bottom: 720, w: 330, side: 74, ...productLooks.afterglow.props })}
       ${vape({ cx: 1620, bottom: 720, w: 76, h: 420, ...productLooks["deep-current"].props })}
       ${frondShadow(0.18, 1200, -300, 30, 1.6)}${grain(0.14)}</div>`
    ),
};

// ---------- run ----------

const only = process.argv.slice(2);
await mkdir(path.join(outDir, "products"), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function shoot(name, html, w, h) {
  if (only.length && !only.some((o) => name.includes(o))) return;
  await pg.setViewportSize({ width: w, height: h });
  await pg.setContent(html, { waitUntil: "load" });
  await pg.waitForTimeout(60);
  await pg.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 84 });
  console.log("rendered", name);
}

for (const [name, fn] of Object.entries(editorial)) {
  const html = fn();
  const m = html.match(/html, body \{ width: (\d+)px; height: (\d+)px/);
  await shoot(name, html, +m[1], +m[2]);
}
for (const slug of Object.keys(productLooks)) {
  await shoot(`products/${slug}-1`, productStudio(slug), S, PH);
  await shoot(`products/${slug}-2`, productSunlit(slug), S, PH);
  await shoot(`products/${slug}-3`, productDetail(slug), S, PH);
}
await browser.close();
