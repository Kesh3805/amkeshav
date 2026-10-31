import type { Work } from "@/lib/schema";
import s from "./Maturity.module.css";

const words = { built: "Built", partial: "Partial", design: "Designed only", planned: "Planned" } as const;

/** What exists, stage by stage, with the evidence for each claim. Shape carries the status, not colour. */
export function Maturity({ stages }: { stages: Work["maturity"] }) {
  if (!stages.length) return null;
  const counts = stages.reduce<Record<string, number>>((a, st) => ((a[st.status] = (a[st.status] ?? 0) + 1), a), {});
  return (
    <section className={s.wrap} aria-labelledby="maturity">
      <div className={s.head}>
        <h2 id="maturity" className={s.title}>
          What exists, honestly
        </h2>
        <p className={s.sum}>
          {(["built", "partial", "design", "planned"] as const)
            .filter((k) => counts[k])
            .map((k) => `${counts[k]} ${words[k].toLowerCase()}`)
            .join(" · ")}
        </p>
      </div>
      <ol className={s.list}>
        {stages.map((st) => (
          <li key={st.name} className={s.row}>
            <span className={s.mark} data-status={st.status} aria-hidden />
            <span className={s.status}>{words[st.status]}</span>
            <span className={s.name}>{st.name}</span>
            <span className={s.evidence}>{st.evidence}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
