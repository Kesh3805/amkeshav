import Link from "next/link";
import type { WorkEntry } from "@/lib/content";
import s from "./ProjectIndex.module.css";

const groups = [
  { kind: "professional", title: "Production", note: "At jpteam / C1X" },
  { kind: "open-source", title: "Open source", note: "At Ostrium Labs" },
  { kind: "research", title: "Research", note: "Registered experiments" },
  { kind: "independent", title: "Independent", note: "On my own time" },
] as const;

/* The work index as a ruled register, grouped by the kind of work. Every summary is visible: nothing on hover. */
export function ProjectIndex({ work }: { work: WorkEntry[] }) {
  const sections = groups
    .map((g) => ({ ...g, rows: work.filter((w) => w.kind === g.kind) }))
    .filter((g) => g.rows.length > 0);
  const number = new Map(sections.flatMap((g) => g.rows).map((w, i) => [w.slug, String(i + 1).padStart(2, "0")]));
  return (
    <div className={`wrap ${s.index}`}>
      {sections.map(({ rows, ...g }) => {
        return (
          <section key={g.kind} className={s.group} aria-labelledby={`k-${g.kind}`}>
            <header className="section-head">
              <h2 id={`k-${g.kind}`} className="section-title">
                {g.title}
              </h2>
              <p className="label">
                {g.note} · {rows.length}
              </p>
            </header>
            <ol className={s.list}>
              {rows.map((w) => {
                return (
                  <li key={w.slug}>
                    <Link href={`/work/${w.slug}/`} className={s.row}>
                      <span className={`label ${s.num}`}>{number.get(w.slug)}</span>
                      <span className={s.name}>{w.short}</span>
                      <span className={s.summary}>{w.summary}</span>
                      <span className={`label ${s.role}`}>{w.role.split(" — ")[0]}</span>
                      <span className={s.arrow} aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
