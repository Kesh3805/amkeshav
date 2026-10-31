import type { ReactNode } from "react";
import { getPrograms } from "@/lib/content";
import s from "./Plates.module.css";

/*
  Project plates. Each one is drawn from numbers the project actually published —
  no screenshots, no stock imagery. ViewBox 1600×1000, cropped to fill.
*/

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg className={s.plate} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <rect width="1600" height="1000" className={s.bg} />
      {children}
    </svg>
  );
}

/** GST platform: the same read, before and after. 3,000ms drawn as 300 ticks; 15ms as one slab. */
export function ReadModelPlate() {
  const x0 = 120;
  const span = 1360;
  const ticks = Array.from({ length: 301 }, (_, i) => i);
  const fast = (15 / 3000) * span;
  return (
    <Frame label="3,000 milliseconds drawn as a long ruler of ticks, and under 15 milliseconds as a single thin blue slab at its start.">
      <text x={x0} y={330} className={s.huge} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5}>
        3,000
      </text>
      {ticks.map((i) => (
        <line
          key={i}
          x1={x0 + (i / 300) * span}
          x2={x0 + (i / 300) * span}
          y1={i % 50 === 0 ? 400 : i % 10 === 0 ? 420 : 432}
          y2={462}
          className={s.ink}
          strokeWidth={i % 50 === 0 ? 2 : 1}
          opacity={i % 10 === 0 ? 0.7 : 0.32}
        />
      ))}
      {[0, 500, 1000, 1500, 2000, 2500, 3000].map((ms) => (
        <text key={ms} x={x0 + (ms / 3000) * span} y={388} className={s.mono} opacity={0.6}>
          {ms}
        </text>
      ))}
      <text x={x0} y={500} className={s.mono} opacity={0.75}>
        BEFORE — STATUS DERIVED FROM GSTR-1 AND GSTR-3B ON EVERY READ · 3,000MS+ AT PEAK
      </text>
      <rect x={x0} y={545} width={Math.max(fast, 7)} height={95} className={s.signal} />
      <text x={x0 + 40} y={582} className={s.mono} opacity={0.75}>
        AFTER — ONE INDEXED SELECT ON A PROJECTION · UNDER 15MS
      </text>
      <text x={x0 + 40} y={618} className={s.mono} opacity={0.45}>
        WRITERS EMIT SOURCE-CHANGED(ACCOUNT, GSTIN, PERIOD) → UPSERT ONE ROW
      </text>
    </Frame>
  );
}

/** Loams: four wire protocols, one bucket you own. */
export function CratesPlate() {
  const protocols = ["QDRANT", "ELASTICSEARCH", "POSTGRES", "MYSQL"];
  const bx = 1180;
  const by = 380;
  return (
    <Frame label="Four wire protocols — Qdrant, Elasticsearch, Postgres and MySQL — converging on a single storage bucket owned by the user.">
      {protocols.map((p, i) => {
        const y = 210 + i * 120;
        return (
          <g key={p}>
            <text x={110} y={y} className={s.big} opacity={0.62}>
              {p}
            </text>
            <path
              d={`M ${p.length * 47 + 140} ${y - 34} C ${bx - 260} ${y - 34}, ${bx - 260} ${by}, ${bx - 40} ${by}`}
              fill="none"
              className={s.ink}
              strokeWidth={1.5}
              opacity={0.45}
            />
          </g>
        );
      })}
      <rect x={bx - 40} y={by - 100} width={200} height={200} className={s.signal} />
      <text x={bx - 40} y={by + 140} className={s.mono} opacity={0.8}>
        YOUR BUCKET · OPEN FORMATS
      </text>
      <text x={bx - 40} y={by + 172} className={s.mono} opacity={0.45}>
        APACHE-2.0 · NO OPEN CORE · ~80 CRATES
      </text>
    </Frame>
  );
}

/** ReviewGraph: the auth-bypass fixture's impact set, by hop distance. */
export function ImpactPlate() {
  const cx = 1000;
  const cy = 400;
  const nodes = [
    { label: "caller · d1 · touches users", x: 830, y: 290, end: true },
    { label: "caller · d2", x: 700, y: 175, end: true },
    { label: "PUT /users/:id · d3 · no guards", x: 1130, y: 150 },
    { label: "overridden interface method", x: 1190, y: 400 },
    { label: "covering test", x: 1110, y: 560 },
    { label: "permissionService.check — removed (base graph)", x: 830, y: 540, end: true, removed: true },
  ];
  return (
    <Frame label="Impact graph of the auth-bypass fixture: one changed method at the centre, six impacted elements around it, two decoys left outside.">
      {[150, 270].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" className={s.ink} opacity={0.16} strokeDasharray="2 8" />
      ))}
      {nodes.map((n) => (
        <g key={n.label}>
          <line x1={cx} y1={cy} x2={n.x} y2={n.y} className={s.ink} opacity={0.4} strokeDasharray={n.removed ? "6 6" : undefined} />
          <rect x={n.x - 9} y={n.y - 9} width={18} height={18} className={n.removed ? s.hollow : s.fill} />
          <text x={n.end ? n.x - 20 : n.x + 20} y={n.y + 6} textAnchor={n.end ? "end" : "start"} className={s.mono} opacity={0.8}>
            {n.label}
          </text>
        </g>
      ))}
      <rect x={cx - 22} y={cy - 22} width={44} height={44} className={s.signal} />
      <text x={cx} y={cy + 58} textAnchor="middle" className={s.mono}>
        AuthService.authorize
      </text>
      <text x={110} y={170} className={s.mono} opacity={0.55}>
        − permissionService.check(...)
      </text>
      <text x={110} y={204} className={s.mono} opacity={0.85}>
        + user.role === &apos;admin&apos;
      </text>
      <text x={110} y={300} className={s.big} opacity={0.65}>
        0.993
      </text>
      <text x={110} y={338} className={s.mono} opacity={0.55}>
        RISK · CRITICAL · 3 RULES
      </text>
      {["ReportService", "format.ts#authorizeHeader"].map((d, i) => (
        <text key={d} x={110} y={440 + i * 34} className={s.mono} opacity={0.38}>
          × {d} — must not appear
        </text>
      ))}
    </Frame>
  );
}

/** FRONTIER: every experiment with a reported interval, on one axis. */
export function IntervalsPlate() {
  const program = getPrograms().find((p) => p.slug === "frontier");
  const rows = (program?.experiments ?? []).filter((e) => e.effect && e.effect.unit !== "% saved");
  const lo = -1;
  const hi = 6;
  const x = (v: number) => 560 + ((v - lo) / (hi - lo)) * 900;
  const y0 = 200;
  const step = 400 / Math.max(rows.length - 1, 1);
  return (
    <Frame label="Forest plot of FRONTIER experiments: point estimates with 95% intervals against a zero line. Several sit at or below zero.">
      <line x1={x(0)} x2={x(0)} y1={140} y2={630} className={s.ink} opacity={0.6} />
      <text x={x(0) + 10} y={170} className={s.mono} opacity={0.6}>
        0 — NO DIFFERENCE
      </text>
      {rows.map((e, i) => {
        const y = y0 + i * step;
        const bad = e.verdict === "refuted";
        return (
          <g key={e.id}>
            <text x={110} y={y + 6} className={s.mono} opacity={0.85}>
              {e.id}
            </text>
            <text x={240} y={y + 6} className={s.mono} opacity={0.45}>
              {e.verdict.toUpperCase()}
            </text>
            <line x1={x(e.effect!.low)} x2={x(e.effect!.high)} y1={y} y2={y} className={s.ink} strokeWidth={3} opacity={0.8} />
            <rect x={x(e.effect!.estimate) - 9} y={y - 9} width={18} height={18} className={bad ? s.signal : s.fill} />
            <text x={x(e.effect!.high) + 18} y={y + 6} className={s.mono} opacity={0.5}>
              {e.effect!.estimate > 0 ? "+" : ""}
              {e.effect!.estimate} {e.effect!.unit}
            </text>
          </g>
        );
      })}
      <text x={110} y={660} className={s.mono} opacity={0.45}>
        95% BOOTSTRAP INTERVALS · Δ VERIFIED SOLVES AGAINST ROUND-ROBIN · BLUE = REFUTED
      </text>
    </Frame>
  );
}

/** Temporal Compute: 200 scenarios, paired against EDF. */
export function TallyPlate() {
  const cells = [...Array(15).fill("win"), ...Array(15).fill("tie"), ...Array(170).fill("loss")] as const;
  const size = 26;
  const gap = 6;
  const cols = 20;
  const ox = 1600 - 110 - cols * (size + gap) + gap;
  const oy = 230;
  return (
    <Frame label="Two hundred squares, one per scenario: 15 wins, 15 ties and 170 losses for the temporal-utility scheduler against EDF.">
      {cells.map((c, i) => (
        <rect
          key={i}
          x={ox + (i % cols) * (size + gap)}
          y={oy + Math.floor(i / cols) * (size + gap)}
          width={size}
          height={size}
          className={c === "win" ? s.fill : c === "tie" ? s.hollow : s.signal}
          opacity={c === "loss" ? 0.92 : 1}
        />
      ))}
      <text x={ox} y={oy - 40} className={s.mono} opacity={0.7}>
        ■ WIN 15 &#160; □ TIE 15 &#160; ■ LOSS 170 — AGAINST EDF, 200 SCENARIOS
      </text>
      <text x={110} y={330} className={s.big} opacity={0.65}>
        −5.07%
      </text>
      <text x={110} y={372} className={s.mono} opacity={0.55}>
        TOTAL UTILITY · 0 OF 5 GATES PASSED
      </text>
      <text x={110} y={408} className={s.mono} opacity={0.4}>
        1,203 JOBS EXPIRED UNSTARTED · EDF: 37
      </text>
    </Frame>
  );
}

/** Ferite: Yosys generic-gate counts as areas, against the die's cell budget. */
export function GatesPlate() {
  const designs = [
    { name: "sha256", gates: 268470 },
    { name: "aes", gates: 181752 },
    { name: "chacha20", gates: 166924 },
  ];
  const k = 420 / Math.sqrt(268470);
  const base = 640;
  let x = 110;
  const die = Math.sqrt(24000) * k;
  return (
    <Frame label="Squares sized by gate count: sha256, aes and chacha20 dwarf the blue outline of the 24,000-cell die budget; crc3 is a speck.">
      {designs.map((d) => {
        const side = Math.sqrt(d.gates) * k;
        const gx = x;
        x += side + 40;
        return (
          <g key={d.name}>
            <rect x={gx} y={base - side} width={side} height={side} fill="none" className={s.ink} opacity={0.55} strokeWidth={1.5} />
            <text x={gx + 14} y={base - side + 34} className={s.mono} opacity={0.8}>
              {d.name} · {d.gates.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}
      <rect x={x} y={base - die} width={die} height={die} fill="none" className={s.signalStroke} strokeWidth={4} />
      <text x={x} y={base - die - 18} className={s.mono}>
        DIE BUDGET ~24,000
      </text>
      <rect x={x} y={base - die - 70} width={9} height={9} className={s.fill} />
      <text x={x + 20} y={base - die - 61} className={s.mono} opacity={0.7}>
        crc3 · 52
      </text>
      <text x={110} y={120} className={s.mono} opacity={0.5}>
        YOSYS GENERIC GATES — NOT AN AREA FIGURE · SQUARES BY √GATES
      </text>
    </Frame>
  );
}

export const plates = {
  readmodel: ReadModelPlate,
  crates: CratesPlate,
  impact: ImpactPlate,
  intervals: IntervalsPlate,
  tally: TallyPlate,
  gates: GatesPlate,
} as const;

export type PlateId = keyof typeof plates;
