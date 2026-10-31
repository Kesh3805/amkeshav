import type { ReactNode } from "react";
import s from "./Figures.module.css";

/** A left-to-right sequence of steps. Wraps on narrow screens, reads as an ordered list. */
export function Flow({ steps }: { steps: string[] }) {
  return (
    <ol className={s.flow}>
      {steps.map((step, i) => (
        <li key={i}>
          <span className={s.flowNum}>{String(i + 1).padStart(2, "0")}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Fig({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className={s.fig}>
      {children}
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
  );
}

/** Durable SSE: a connection drops, the browser reconnects with Last-Event-ID, the table replays what it missed. */
export function SseDurability() {
  const rows = [
    { t: "41", e: "extraction.completed", kind: "sent" },
    { t: "—", e: "connection drops", kind: "gap" },
    { t: "42", e: "reconciliation.completed — written to the table while no one is listening", kind: "missed" },
    { t: "→", e: "reconnect · Last-Event-ID: 41", kind: "resume" },
    { t: "42", e: "reconciliation.completed — replayed from the table", kind: "replay" },
    { t: "43", e: "ims.synced", kind: "sent" },
    { t: "♥", e: "heartbeat every 25 s", kind: "beat" },
  ];
  return (
    <Fig caption="Replay, then live. The row's primary key is the event id, so 'what did I miss?' is one query.">
      <ol className={s.timeline}>
        {rows.map((r, i) => (
          <li key={i} data-kind={r.kind}>
            <span className={s.tlId}>{r.t}</span>
            <span>{r.e}</span>
          </li>
        ))}
      </ol>
    </Fig>
  );
}

/** Returns read model: the work moves from the read side to the write side. */
export function ReadModel() {
  return (
    <Fig caption="Before, every read rebuilt status from both filings. After, writers announce a key and one row is recomputed.">
      <div className={s.twoUp}>
        <div>
          <span className="label">Before · read side does the work</span>
          <ol className={s.steps}>
            <li>request</li>
            <li>read GSTR-1 state</li>
            <li>read GSTR-3B state</li>
            <li>derive status</li>
            <li className={s.strong}>3,000ms+ at peak</li>
          </ol>
        </div>
        <div>
          <span className="label">After · write side keeps it current</span>
          <ol className={s.steps}>
            <li>writer commits a filing change</li>
            <li>emit source-changed(account, gstin, period)</li>
            <li>re-read both sources, upsert one row</li>
            <li>request → SELECT one row by key</li>
            <li className={s.strong}>under 15ms at peak</li>
          </ol>
        </div>
      </div>
    </Fig>
  );
}

/** The BullMQ split: same queue name, different prefix, so different keys. */
export function QueueIdentity() {
  return (
    <Fig caption="A BullMQ queue is prefix + name. The two sides agreed on the name and nothing else.">
      <div className={s.twoUp}>
        <div>
          <span className="label">Extraction worker · producer</span>
          <code className={s.key}>bull:extraction:wait</code>
          <span className={s.note}>prefix never set → default “bull” · list keeps growing</span>
        </div>
        <div>
          <span className="label">Core service · consumer</span>
          <code className={s.key}>bull:&lt;env&gt;:extraction:wait</code>
          <span className={s.note}>environment-namespaced · always empty</span>
        </div>
      </div>
      <p className={s.fix}>
        Fix: one queue definition — prefix, name and job options — that both sides import, with a test asserting the resolved
        prefix.
      </p>
    </Fig>
  );
}

/** Mermaid source rendered as readable edges, without shipping a diagram engine. */
export function EdgeList({ source }: { source: string }) {
  const label = new Map<string, string>();
  const clean = (v: string) => v.replace(/<br\/?>/g, " · ").replace(/^["']|["']$/g, "").trim();
  const nodeRe = /([A-Za-z0-9_]+)\s*(?:\[\(|\[\[|\(\[|\[|\(\(|\(|\{)([^\]\)\}]+)(?:\)\]|\]\]|\]\)|\]|\)\)|\)|\})/g;
  for (const m of source.matchAll(nodeRe)) label.set(m[1], clean(m[2]));
  const edges: { from: string; to: string; via?: string; dashed: boolean }[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.replace(nodeRe, "$1").trim();
    const m = line.match(/^([A-Za-z0-9_]+)\s*(-\.->|-->|--\s[^-]+-->|==>)\s*(?:\|([^|]+)\|\s*)?([A-Za-z0-9_]+)/);
    if (!m) continue;
    const via = m[3] ?? (m[2].startsWith("-- ") ? m[2].slice(3, -3).trim() : undefined);
    edges.push({ from: m[1], to: m[4], via: via ? clean(via) : undefined, dashed: m[2] === "-.->" });
  }
  if (!edges.length) return null;
  const name = (id: string) => label.get(id) ?? id;
  return (
    <figure className={s.fig}>
      <ol className={s.edges}>
        {edges.map((e, i) => (
          <li key={i} data-dashed={e.dashed || undefined}>
            <span>{name(e.from)}</span>
            <span className={s.arrow}>{e.via ? `— ${e.via} →` : "→"}</span>
            <span>{name(e.to)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
