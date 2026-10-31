import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/chrome/PageHead";
import { getPrograms } from "@/lib/content";
import type { Experiment, Verdict } from "@/lib/schema";
import s from "./research.module.css";

export const metadata: Metadata = {
  title: "Research",
  description: "FRONTIER and Temporal Compute: every registered experiment, with its verdict — including the ones that failed or never ran.",
};

const verdictWord: Record<Verdict, string> = {
  pass: "Pass",
  fail: "Fail",
  mixed: "Mixed",
  supported: "Supported",
  refuted: "Refuted",
  inconclusive: "Inconclusive",
  superseded: "Superseded",
  "not-run": "Not run",
};

function Interval({ e }: { e: Experiment }) {
  if (!e.effect) return null;
  const { low, high, estimate, unit, label } = e.effect;
  const lo = Math.min(low, 0);
  const hi = Math.max(high, 0);
  const span = hi - lo || 1;
  const x = (v: number) => `${((v - lo) / span) * 100}%`;
  return (
    <div className={s.interval} aria-label={`${label}: ${estimate} ${unit}, 95% interval ${low} to ${high}`} role="img">
      <div className={s.axis}>
        <span className={s.zero} style={{ left: x(0) }} />
        <span className={s.ci} style={{ left: x(low), width: `calc(${x(high)} - ${x(low)})` }} />
        <span className={s.est} style={{ left: x(estimate) }} />
      </div>
      <span className={s.intervalText}>
        {estimate > 0 ? "+" : ""}
        {estimate} {unit} [{low}, {high}] · {label}
      </span>
    </div>
  );
}

export default function ResearchPage() {
  const programs = getPrograms();
  const all = programs.flatMap((p) => p.experiments);
  const tally = all.reduce<Record<string, number>>((a, e) => ((a[e.verdict] = (a[e.verdict] ?? 0) + 1), a), {});

  return (
    <>
      <PageHead label="Research" aside={`${all.length} registered entries`} title="Research">
        <p>
          Two programs. I write down what an experiment is supposed to show before it runs, and the result stays here
          whichever way it goes.
        </p>
        <p className="mono" style={{ color: "var(--ink-2)" }}>
          {Object.entries(tally)
            .map(([k, n]) => `${n} ${verdictWord[k as Verdict].toLowerCase()}`)
            .join(" · ")}
        </p>
      </PageHead>

      {programs.map((p) => (
        <section key={p.slug} id={p.slug} className={s.program} aria-labelledby={`${p.slug}-t`}>
          <div className={s.programHead}>
            <span className="label">{p.program}</span>
            <h2 id={`${p.slug}-t`} className={s.programTitle}>
              {p.title}
            </h2>
            <p className={s.question}>{p.question}</p>
            <p className={s.summary}>{p.summary}</p>
            <p className={s.state}>
              <span className="label">State</span> {p.maturity}
            </p>
            <p className={s.links}>
              <a href={p.repository} className="link">
                Source on GitHub ↗
              </a>
              <Link href={`/work/${p.slug}`} className="link">
                Case study
              </Link>
            </p>
          </div>

          <ol className={s.ledger}>
            {p.experiments.map((e) => (
              <li key={e.id} className={s.exp} data-verdict={e.verdict}>
                <div className={s.expHead}>
                  <span className={s.expId}>{e.id}</span>
                  <span className={s.verdict} data-verdict={e.verdict}>
                    <span className={s.vMark} aria-hidden />
                    {verdictWord[e.verdict]}
                  </span>
                  {e.date && <span className={s.date}>{e.date}</span>}
                </div>
                <h3 className={s.expTitle}>{e.title}</h3>
                <dl className={s.fields}>
                  <dt>Called first</dt>
                  <dd>{e.hypothesis}</dd>
                  <dt>Setup</dt>
                  <dd>{e.setup}</dd>
                  <dt>Against</dt>
                  <dd>{e.baseline}</dd>
                  <dt>Result</dt>
                  <dd className={s.result}>{e.result}</dd>
                  {e.limitations && e.limitations !== "—" && (
                    <>
                      <dt>Limits</dt>
                      <dd>{e.limitations}</dd>
                    </>
                  )}
                </dl>
                <Interval e={e} />
                <span className={s.source}>{e.source}</span>
              </li>
            ))}
          </ol>

          <div className={s.after}>
            <div>
              <span className="label">Next</span>
              <ol>
                {p.next.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
            </div>
            <div>
              <span className="label">Reproduce</span>
              <pre className={s.reproduce} tabIndex={0}>{p.reproduce.join("\n")}</pre>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
