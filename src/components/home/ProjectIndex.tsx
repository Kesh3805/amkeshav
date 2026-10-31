import Link from "next/link";
import type { WorkEntry } from "@/lib/content";
import s from "./ProjectIndex.module.css";

const kind = {
  professional: "Production",
  independent: "Independent",
  "open-source": "Open source",
  research: "Research",
} as const;

/* Everything else, as a hover list: rows open taller and the name widens to make room for the summary. */
export function ProjectIndex({
  work,
  label = "04 — More work",
  heading = "Also built, maintained, or contributed to.",
}: {
  work: WorkEntry[];
  label?: string;
  heading?: string;
}) {
  return (
    <section className={s.section} aria-labelledby="index-title">
      <div className={s.top}>
        <span className="label">{label}</span>
        <span className="label">{work.length} entries</span>
      </div>
      <h2 id="index-title" className={s.title}>
        {heading}
      </h2>
      <ol className={s.list}>
        {work.map((w) => (
          <li key={w.slug} className={s.row}>
            <Link href={`/work/${w.slug}`} className={s.link}>
              <span className={s.kind}>{kind[w.kind]}</span>
              <span className={s.name}>{w.short}</span>
              <span className={s.role}>{w.role.split(" — ")[0]}</span>
              <span className={s.summary}>
                <span>{w.summary}</span>
              </span>
              <span className={s.arrow} aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
