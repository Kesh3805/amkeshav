// Drawings for the still test. Every figure drawn here traces to content/ or to the
// FRONTIER repo's results/exp-009/README.md; illustrative elements are labelled as such.

const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function txt(parent, x, y, str, cls, anchor = "start", extra = {}) {
  const t = el("text", { x, y, class: cls, "text-anchor": anchor, ...extra }, parent);
  t.textContent = str;
  return t;
}

function lines(parent, x, y, rows, cls, lh, anchor) {
  rows.forEach((r, i) => txt(parent, x, y + i * lh, r, cls, anchor));
}

function line(parent, x1, y1, x2, y2, cls, end) {
  const a = { x1, y1, x2, y2, class: cls };
  if (end) a["marker-end"] = `url(#${end})`;
  return el("line", a, parent);
}

// Evidence label: a boxed word, the same everywhere. Returns its width.
function ev(parent, x, y, word) {
  const w = word.length * 6.9 + 12;
  const g = el("g", { class: "ev" }, parent);
  el("rect", { x, y: y - 11, width: w, height: 16 }, g);
  txt(g, x + 6, y + 1, word, "");
  return w;
}

function box(parent, x, y, w, h, title, sub = []) {
  el("rect", { x, y, width: w, height: h, class: "ln", fill: "var(--paper)" }, parent);
  txt(parent, x + 12, y + 22, title, "labk");
  lines(parent, x + 12, y + 44, sub, "note", 19);
}

function svgFor(host, w, h) {
  host.textContent = "";
  const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img" }, host);
  const defs = el("defs", {}, s);
  const m = el("marker", { id: "ah", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0,1.5 L9,5 L0,8.5", fill: "none", stroke: "var(--ink)", "stroke-width": 1.25 }, m);
  const m2 = el("marker", { id: "ah2", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0,2 L9,5 L0,8", fill: "none", stroke: "var(--ink-2)", "stroke-width": 1 }, m2);
  return s;
}

const spread = (a, b, n, i) => (n === 1 ? (a + b) / 2 : a + ((b - a) * i) / (n - 1));

// The returns dashboard: client GSTINs x tax periods. Cell count is illustrative.
function grid(g, x, y) {
  const R = 6, C = 3, cw = 30, ch = 18, gap = 6;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      el("rect", { x: x + c * (cw + gap), y: y + r * (ch + gap), width: cw, height: ch, class: "thin", fill: "var(--paper)" }, g);
  return { w: C * cw + (C - 1) * gap, h: R * ch + (R - 1) * gap };
}

/* ---------------- GST: the answer kept before anyone asks ---------------- */

function gst(host, narrow) {
  if (!narrow) {
    const W = 1200, H = 640;
    const s = svgFor(host, W, H);
    const API = { x: 160, w: 156, h: 76 }, SRC = { x: 930, w: 270 };

    // Before: the reader asks
    let y0 = 0;
    txt(s, 0, y0 + 12, "Before", "labk");
    txt(s, 70, y0 + 12, "The reader asks every source, for every cell on screen.", "note");
    txt(s, 0, y0 + 48, "Returns dashboard", "lab");
    let gd = grid(s, 0, y0 + 60);
    const apiY = y0 + 92;
    box(s, API.x, apiY, API.w, API.h, "Returns read API", ["derives status on", "every request"]);
    for (let i = 0; i < 18; i++)
      line(s, gd.w + 6, spread(y0 + 62, y0 + 196, 18, i), API.x, spread(apiY + 8, apiY + API.h - 8, 18, i), "hair");
    const s1 = { y: y0 + 34, h: 96 }, s3 = { y: y0 + 150, h: 96 };
    box(s, SRC.x, s1.y, SRC.w, s1.h, "GSTR-1", ["outward supplies: draft creation,", "portal sync, GSTN submission"]);
    box(s, SRC.x, s3.y, SRC.w, s3.h, "GSTR-3B", ["monthly summary, its own state", "machine; CAs correct tiles by hand"]);
    for (let i = 0; i < 18; i++) {
      line(s, API.x + API.w, spread(apiY + 6, apiY + API.h - 6, 36, i * 2), SRC.x, spread(s1.y + 8, s1.y + s1.h - 8, 18, i), "thin");
      line(s, API.x + API.w, spread(apiY + 6, apiY + API.h - 6, 36, i * 2 + 1), SRC.x, spread(s3.y + 8, s3.y + s3.h - 8, 18, i), "thin");
    }
    let w = ev(s, 0, y0 + 236, "Measured");
    txt(s, w + 10, y0 + 237, "> 3,000 ms at peak load", "val");
    txt(s, 0, y0 + 260, "as reported in the write-up; method not published", "note");

    // After: the writers tell
    y0 = 320;
    line(s, 0, y0 - 30, W, y0 - 30, "hair");
    txt(s, 0, y0 + 12, "After", "labk");
    txt(s, 62, y0 + 12, "The writers keep one row current. The reader fetches it.", "note");
    txt(s, 0, y0 + 48, "Returns dashboard", "lab");
    gd = grid(s, 0, y0 + 60);
    const apiY2 = y0 + 92;
    box(s, API.x, apiY2, API.w, API.h, "Returns read API", ["one indexed SELECT", "per account"]);
    line(s, gd.w + 6, apiY2 + API.h / 2, API.x, apiY2 + API.h / 2, "ln");

    const T = { x: 380, y: y0 + 60, w: 236, rh: 22 };
    const rowY = T.y + T.rh * 3.5;
    txt(s, T.x, T.y - 12, "return_status", "labk");
    el("rect", { x: T.x, y: T.y, width: T.w, height: T.rh * 7, class: "ln", fill: "var(--paper)" }, s);
    txt(s, T.x + 10, T.y + 16, "account, gstin, period", "note", "start", { style: "font-size:13px" });
    txt(s, T.x + 176, T.y + 15, "status", "lab");
    line(s, T.x, T.y + T.rh, T.x + T.w, T.y + T.rh, "thin");
    line(s, T.x + 166, T.y, T.x + 166, T.y + T.rh * 7, "hair");
    for (let r = 2; r < 7; r++) line(s, T.x, T.y + T.rh * r, T.x + T.w, T.y + T.rh * r, "hair");
    el("rect", { x: T.x + 1, y: T.y + T.rh * 3 + 1, width: T.w - 2, height: T.rh - 2, class: "tint" }, s);
    txt(s, T.x, T.y + T.rh * 7 + 22, "one row per (account, GSTIN, period)", "note");
    line(s, API.x + API.w, apiY2 + API.h / 2, T.x, rowY, "ln", "ah");
    txt(s, API.x + API.w + 10, apiY2 + API.h / 2 - 10, "by key", "lab");

    const P = { x: 680, y: y0 + 96, w: 136, h: 76 };
    const pm = P.y + P.h / 2;
    box(s, P.x, P.y, P.w, P.h, "Projector", ["recomputes one", "row, upserts it"]);
    line(s, P.x, pm, T.x + T.w, rowY, "ln2", "ah");
    lines(s, P.x, P.y + P.h + 24, ["then reads the sources", "as they are now"], "note", 19);

    const t1 = { y: y0 + 34, h: 96 }, t3 = { y: y0 + 150, h: 96 };
    box(s, SRC.x, t1.y, SRC.w, t1.h, "GSTR-1 writer", ["every writer that changes return", "state announces it"]);
    box(s, SRC.x, t3.y, SRC.w, t3.h, "GSTR-3B writer", ["filing, and CAs' hand", "corrections to tiles"]);
    const mids = [];
    for (const [t, d] of [[t1, -1], [t3, 1]]) {
      const cy = t.y + t.h / 2;
      line(s, SRC.x, cy - 8, P.x + P.w, pm + d * 10, "ln2", "ah");
      line(s, P.x + P.w, pm + d * 26, SRC.x, cy + 10, "thin dash", "ah2");
      mids.push([P.x + P.w + 0.72 * (SRC.x - P.x - P.w), pm + d * 10 + 0.72 * (cy - 8 - pm - d * 10)]);
    }
    txt(s, (SRC.x + P.x + P.w) / 2, y0 + 30, "source-changed: the key only", "lab", "middle");
    const [rx, ry] = mids[0];
    el("circle", { cx: rx, cy: ry, r: 13, class: "ln", fill: "var(--paper)" }, s);
    txt(s, rx, ry + 4.5, "1", "val", "middle");

    w = ev(s, 0, y0 + 236, "Measured");
    txt(s, w + 10, y0 + 237, "< 15 ms at peak load", "val");
    txt(s, 0, y0 + 260, "as reported; the only two measurements", "note");
    w = ev(s, 0, H - 10, "Reconstructed");
    txt(s, w + 10, H - 9, "redrawn from Keshav's published write-up; not the employer's diagram", "note");
    return;
  }

  // Narrow: before and after side by side, one representative path each, the repetition stated.
  const W = 360, H = 700;
  const s = svgFor(host, W, H);
  const cw = 168, L = 0, R = W - cw;
  const mid = (x) => x + cw / 2;

  for (const [x, head, note] of [[L, "Before", ["The reader asks every", "source, for every cell."]], [R, "After", ["The writers keep one", "row current."]]]) {
    txt(s, x, 12, head, "labk");
    lines(s, x, 36, note, "note", 19);
    // the dashboard, small: cells are illustrative
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++)
        el("rect", { x: mid(x) - 37 + c * 26, y: 88 + r * 16, width: 22, height: 12, class: x === L && r === 1 && c === 0 ? "ln" : "thin", fill: x === L && r === 1 && c === 0 ? "var(--ink-4)" : "var(--paper)" }, s);
    txt(s, mid(x), 80, "Dashboard", "lab", "middle");
    box(s, x + 9, 180, cw - 18, 58, "Read API", [x === L ? "derives status" : "one SELECT"]);
    // the same two sources at the bottom of both columns
    el("rect", { x: x + 9, y: 530, width: 70, height: 34, class: "ln", fill: "var(--paper)" }, s);
    el("rect", { x: x + cw - 79, y: 530, width: 70, height: 34, class: "ln", fill: "var(--paper)" }, s);
    txt(s, x + 44, 551, "GSTR-1", "labk", "middle");
    txt(s, x + cw - 44, 551, "GSTR-3B", "labk", "middle");
  }
  line(s, W / 2, 0, W / 2, 640, "hair");

  // Before: one cell's request, then one question per source. Repeated for every cell.
  line(s, mid(L) - 26, 120, mid(L) - 20, 180, "ln", "ah");
  txt(s, mid(L) - 14, 162, "× every cell", "lab");
  line(s, L + 44, 238, L + 44, 530, "ln", "ah");
  line(s, L + cw - 44, 238, L + cw - 44, 530, "ln", "ah");
  lines(s, mid(L), 360, ["× every source,", "per cell"], "lab", 16, "middle");
  [...s.querySelectorAll("text")].slice(-2).forEach((t) => t.setAttribute("style", "paint-order:stroke;stroke:var(--paper);stroke-width:6px"));
  ev(s, L, 600, "Measured");
  txt(s, L, 624, "> 3,000 ms", "val");
  txt(s, L, 642, "at peak load", "lab");

  // After: one read by key; writers push keys to the projector, which rewrites one row.
  line(s, mid(R), 154, mid(R), 180, "ln");
  const T = { x: R + 9, y: 284, w: cw - 18, rh: 12 };
  line(s, mid(R), 238, mid(R), T.y, "ln", "ah");
  txt(s, mid(R) + 6, 262, "by key", "lab");
  el("rect", { x: T.x, y: T.y, width: T.w, height: T.rh * 6, class: "ln", fill: "var(--paper)" }, s);
  for (let r = 1; r < 6; r++) line(s, T.x, T.y + T.rh * r, T.x + T.w, T.y + T.rh * r, "hair");
  el("rect", { x: T.x + 1, y: T.y + T.rh * 2 + 1, width: T.w - 2, height: T.rh - 2, class: "tint" }, s);
  txt(s, T.x, T.y + T.rh * 6 + 18, "one row per key", "note");
  const P = { x: R + 24, y: 400, w: cw - 48, h: 50 };
  el("rect", { x: P.x, y: P.y, width: P.w, height: P.h, class: "ln", fill: "var(--paper)" }, s);
  txt(s, mid(R), P.y + 22, "Projector", "labk", "middle");
  txt(s, mid(R), P.y + 40, "rewrites a row", "note", "middle");
  line(s, mid(R), P.y, mid(R), T.y + T.rh * 6 + 26, "ln2", "ah");
  line(s, R + 44, 530, P.x + 14, P.y + P.h, "ln2", "ah");
  line(s, R + cw - 44, 530, P.x + P.w - 14, P.y + P.h, "ln2", "ah");
  line(s, P.x + 30, P.y + P.h, R + 60, 530, "thin dash", "ah2");
  line(s, P.x + P.w - 30, P.y + P.h, R + cw - 60, 530, "thin dash", "ah2");
  el("circle", { cx: R + 20, cy: 470, r: 11, class: "ln", fill: "var(--paper)" }, s);
  txt(s, R + 20, 474, "1", "val", "middle");
  txt(s, R + 20, 500, "key", "lab", "middle");
  txt(s, R + 20, 514, "only", "lab", "middle");
  ev(s, R, 600, "Measured");
  txt(s, R, 624, "< 15 ms", "val");
  txt(s, R, 642, "at peak load", "lab");

  const w = ev(s, 0, H - 22, "Reconstructed");
  txt(s, w + 8, H - 21, "from Keshav's write-up", "note");
  txt(s, 0, H - 2, "dashed: the projector reads the sources as they are now", "note", "start", { style: "font-size:13px" });
}

/* ---------------- FRONTIER: the model, then the measurement ---------------- */

// exp-009: the charge model billed 0.005 CU per case and nothing for overhead; early stop
// at a mean of 14.1 of 199 cases -> 92.9% modelled saving. Measured on 1,020 failing
// candidates: 131.8 ms full, 124.1 ms early stop; saving 6.4% [5.1, 7.8]; fixed overhead
// 92% [86, 97] of a full verification.
const FX = { cases: 199, stop: 14.1, full: 131.8, early: 124.1, fixedShare: 0.92 };

function frontier(host, narrow, compact) {
  const W = compact ? 360 : narrow ? 360 : 1200;
  const H = compact ? 180 : narrow ? 590 : 470;
  const s = svgFor(host, W, H);
  const b1 = compact ? { y: 20, h: 26 } : { y: narrow ? 140 : 92, h: 34 };
  const b2 = compact ? { y: 128, h: 26 } : { y: narrow ? 384 : 300, h: 34 };
  const x1 = (i) => (W * i) / FX.cases;
  const xf = W * FX.fixedShare;
  const x2 = (i) => xf + ((W - xf) * i) / FX.cases;
  const xs = x1(FX.stop);
  const xe = (W * FX.early) / FX.full;

  // Model bar: 199 equal cases, early stop charged, the rest "saved".
  el("rect", { x: 0, y: b1.y, width: xs, height: b1.h, class: "tint" }, s);
  for (let i = 0; i <= FX.cases; i++) line(s, x1(i), b1.y, x1(i), b1.y + b1.h, i % 10 === 0 ? "thin" : "hair");
  el("rect", { x: 0, y: b1.y, width: W, height: b1.h, class: "ln" }, s);
  line(s, xs, b1.y - 8, xs, b1.y + b1.h + 8, "ln2");

  // The same 199 cases, projected onto where they actually sit in measured time.
  for (let i = 0; i <= FX.cases; i += 10) line(s, x1(i), b1.y + b1.h, x2(i), b2.y, i % 50 === 0 ? "thin" : "hair");
  line(s, x1(FX.cases), b1.y + b1.h, x2(FX.cases), b2.y, "thin");

  // Measured bar: fixed overhead, then the cases squeezed into the end.
  el("rect", { x: 0, y: b2.y, width: xf, height: b2.h, class: "tint" }, s);
  for (let i = 0; i <= FX.cases; i += 2) line(s, x2(i), b2.y, x2(i), b2.y + b2.h, "hair");
  el("rect", { x: 0, y: b2.y, width: W, height: b2.h, class: "ln" }, s);
  line(s, xf, b2.y, xf, b2.y + b2.h, "ln");
  line(s, xe, b2.y - 8, xe, b2.y + b2.h + 8, "ln2");
  if (compact) return;

  const halo = { style: "paint-order:stroke;stroke:var(--paper);stroke-width:6px;stroke-linejoin:round" };
  const dim = (xa, xb, y) => {
    line(s, xa, y, xb, y, "thin");
    line(s, xa, y - 5, xa, y + 5, "thin");
    line(s, xb, y - 5, xb, y + 5, "thin");
  };

  // Row 1 text
  let w;
  txt(s, 0, 12, "Charge, as the model billed it", "labk");
  w = ev(s, narrow ? 0 : 262, narrow ? 38 : 12, "Modelled");
  if (narrow) {
    lines(s, 0, 66, ["0.005 CU per case, nothing for overhead"], "note", 19);
  } else {
    txt(s, 262 + w + 12, 13, "199 cases at 0.005 CU each, and nothing for the call itself", "note");
  }
  const dimY1 = b1.y - 18;
  dim(xs, W, dimY1);
  txt(s, W, dimY1 - 12, "92.9% less charged", "big", "end", narrow ? { style: "font-size:24px" } : {});
  txt(s, 0, b1.y + b1.h + 24, `early stop: mean ${FX.stop} cases`, "val", "start", halo);

  // Row 2 text
  txt(s, xf / 2, b2.y + b2.h / 2 + 4, narrow ? "fixed overhead 92% [86, 97]" : "fixed overhead per call: 92% [86, 97] of a full verification", "labk", "middle");
  const dimY2 = b2.y + b2.h + 20;
  dim(xe, W, dimY2);
  txt(s, W, dimY2 + 36, "6.4% less time", "big", "end", narrow ? { style: "font-size:24px" } : {});
  txt(s, W, dimY2 + 56, "[5.1, 7.8]", "val", "end");
  txt(s, xe - 10, b2.y - 14, `early stop ${FX.early} ms`, "val", "end", halo);
  const r2y = narrow ? dimY2 + 92 : dimY2 + 16;
  txt(s, 0, r2y, "Wall time, as measured", "labk");
  w = ev(s, 196, r2y, "Measured");
  if (narrow) {
    lines(s, 0, r2y + 26, ["mean of 1,020 failing candidates:", "131.8 ms in full, 124.1 ms stopping early"], "note", 19);
  } else {
    lines(s, 0, r2y + 26, ["mean wall time of 1,020 failing candidates:", "131.8 ms in full, 124.1 ms stopping early; one host"], "note", 19);
  }
  // callout ring on the squeezed cases
  const cx = narrow ? W - 14 : (xf + W) / 2, cy = b2.y - (narrow ? 44 : 40);
  el("circle", { cx, cy, r: 13, class: "ln", fill: "var(--paper)" }, s);
  txt(s, cx, cy + 4.5, "1", "val", "middle");
  line(s, cx, cy + 13, cx, b2.y - 2, "thin");
  // The revision: the assumption linking the two bars, not either number.
  const fx = narrow ? 0 : W * 0.4, fy = (b1.y + b2.y + b1.h) / 2 + (narrow ? 10 : -8);
  txt(s, fx, fy, "Assumed: charge tracks time · refuted, exp-009", "lab acc-t", "start", narrow ? { style: halo.style + ";font-size:11.5px" } : halo);
  lines(s, fx, fy + 22, narrow ? ["schematic: the same 199 cases, placed", "by the fitted timing (≈ 120.5 ms + 0.05 ms", "per case)"]
    : ["schematic: the same 199 cases, placed by the fitted timing (≈ 120.5 ms + 0.05 ms per case)"], "note", 19, "start");
  [...s.querySelectorAll("text")].slice(-3).forEach((t) => t.setAttribute("style", "paint-order:stroke;stroke:var(--paper);stroke-width:6px;stroke-linejoin:round"));
}

// Magnified detail of the measured bar's last 8%: the cases.
function frontierDetail(host) {
  const W = 360, H = 120;
  const s = svgFor(host, W, H);
  const n = FX.cases;
  for (let i = 0; i <= n; i++) line(s, (W * i) / n, 30, (W * i) / n, 66, i === 1 ? "ln2" : i % 10 === 0 ? "thin" : "hair");
  el("rect", { x: 0, y: 30, width: W, height: 36, class: "ln" }, s);
  txt(s, 0, 18, "the cases, ≈ 0.05 ms each (fitted)", "lab");
  txt(s, 0, 88, "half the failing candidates stop at case 1", "note");
  txt(s, W, 110, "≈ 10 ms for all 199", "val", "end");
}

/* ---------------- Cover miniatures ---------------- */

function miniGst(host) {
  const W = 360, H = 180;
  const s = svgFor(host, W, H);
  const dot = (x, y) => el("rect", { x, y, width: 10, height: 6, class: "thin", fill: "var(--paper)" }, s);
  for (const [y0, after] of [[8, false], [100, true]]) {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) dot(c * 14, y0 + r * 12);
    el("rect", { x: 300, y: y0, width: 60, height: 20, class: "ln", fill: "var(--paper)" }, s);
    el("rect", { x: 300, y: y0 + 30, width: 60, height: 20, class: "ln", fill: "var(--paper)" }, s);
    if (!after) {
      for (let i = 0; i < 12; i++) {
        line(s, 44, y0 + 2 + i * 4, 300, y0 + 2 + i * 1.5, "hair");
        line(s, 44, y0 + 2 + i * 4, 300, y0 + 32 + i * 1.5, "hair");
      }
    } else {
      line(s, 44, y0 + 22, 130, y0 + 22, "ln", "ah");
      el("rect", { x: 130, y: y0 + 4, width: 70, height: 40, class: "ln", fill: "var(--paper)" }, s);
      for (let r = 1; r < 5; r++) line(s, 130, y0 + 4 + r * 8, 200, y0 + 4 + r * 8, "hair");
      line(s, 300, y0 + 10, 200, y0 + 20, "ln2", "ah");
      line(s, 300, y0 + 40, 200, y0 + 28, "ln2", "ah");
    }
  }
}

function miniGraph(host) {
  const W = 360, H = 180;
  const s = svgFor(host, W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const c = { x: 180, y: 90 };
  const pts = [c];
  while (pts.length < 46) {
    const p = { x: 14 + rnd() * (W - 28), y: 10 + rnd() * (H - 20) };
    if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 26)) pts.push(p);
  }
  const d = (p) => Math.hypot(p.x - c.x, p.y - c.y);
  for (const p of pts) {
    const near = pts.filter((q) => q !== p).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 2);
    for (const q of near) line(s, p.x, p.y, q.x, q.y, Math.max(d(p), d(q)) < 52 ? "thin" : "hair");
  }
  el("circle", { cx: c.x, cy: c.y, r: 52, class: "thin dash" }, s);
  el("circle", { cx: c.x, cy: c.y, r: 96, class: "hair dash" }, s);
  for (const p of pts) {
    const r = p === c ? 5 : 3;
    el("circle", { cx: p.x, cy: p.y, r, class: p === c ? "fill" : d(p) < 52 ? "ln" : "hair", fill: p === c ? "var(--ink)" : "var(--paper)" }, s);
  }
}

// TC-S1: 200 scenarios against EDF, 15 won, 15 tied, 170 lost (content/research/temporal-compute.json).
function miniTc(host) {
  const W = 360, H = 180;
  const s = svgFor(host, W, H);
  const cols = 25, cell = 12, gap = 2.4, x0 = 0, y0 = 26;
  for (let i = 0; i < 200; i++) {
    const x = x0 + (i % cols) * (cell + gap), y = y0 + Math.floor(i / cols) * (cell + gap);
    if (i < 15) el("rect", { x, y, width: cell, height: cell, class: "fill" }, s);
    else if (i < 30) {
      el("rect", { x, y, width: cell, height: cell, class: "thin", fill: "var(--paper)" }, s);
      line(s, x, y + cell, x + cell, y, "thin");
    } else el("rect", { x, y, width: cell, height: cell, class: "hair", fill: "var(--paper)" }, s);
  }
  txt(s, 0, 14, "TC-S1 against EDF, 200 scenarios", "lab");
  txt(s, 0, 160, "15 won · 15 tied · 170 lost", "val");
}

function miniPending(host) {
  const W = 360, H = 180;
  const s = svgFor(host, W, H);
  el("rect", { x: 1, y: 1, width: W - 2, height: H - 2, class: "hair dash" }, s);
  txt(s, W / 2, 86, "Drawing pending", "lab", "middle");
  txt(s, W / 2, 106, "subsystem to be chosen with Keshav", "note", "middle");
}

/* ---------------- Mounting ---------------- */

function mount(sel, fn, ...args) {
  const host = document.querySelector(sel);
  let last;
  const draw = () => {
    const narrow = host.clientWidth < 700;
    if (narrow !== last) fn(host, (last = narrow), ...args);
  };
  draw();
  new ResizeObserver(draw).observe(host);
}

(function setType() {
  const t = new URLSearchParams(location.search).get("type");
  if (t) document.documentElement.dataset.type = t;
})();
