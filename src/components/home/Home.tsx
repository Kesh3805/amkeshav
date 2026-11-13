import Link from "next/link";
import { plates } from "@/components/plates/Plates";
import { Nomogram } from "@/components/unwritten/folio/NomogramChart";
import { histogram } from "@/components/unwritten/folio/nomogram";
import { getExp009Nomogram, getPrograms, getWork, getWorkBySlug, getWriting, type WorkEntry } from "@/lib/content";
import { HomeMotion } from "./HomeMotion";
import s from "./Home.module.css";

/*
  The homepage as an engineering folio (ChatGPT's brief of 12 Nov 2026, docs/homepage/BRIEF.md). The work is
  the visual identity: type sets the hierarchy, the projects' own engineering drawings give the character,
  and motion only reveals structure (HomeMotion). It must read as finished with every animation off.
*/

const SELECTED = ["gst-platform", "loams", "reviewgraph", "temporal-compute"] as const;
const kind = { professional: "Production", independent: "Independent", "open-source": "Open source", research: "Research" } as const;
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export function Home() {
  const selected = SELECTED.map((slug) => getWorkBySlug(slug)).filter((w): w is WorkEntry => !!w);
  const frontier = getWorkBySlug("frontier");
  const programs = getPrograms();
  const writing = getWriting();
  const exp009 = getExp009Nomogram();
  const log = programs
    .flatMap((p) => p.experiments.filter((e) => e.date).map((e) => ({ program: p.title, slug: p.slug, ...e })))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.id.localeCompare(b.id))
    .slice(0, 6);

  return (
    <div className={s.home}>
      <section className={`wrap ${s.hero}`} aria-labelledby="statement">
        <h1 id="statement" className={s.statement}>
          <span className={s.right}>I build backends</span> <span className={s.right}>that have to be right,</span>{" "}
          <span className={s.wrong}>and run experiments</span> <span className={s.wrong}>that are allowed to be wrong.</span>
        </h1>

        <aside className={s.modes} aria-label="Two modes of work">
          <p className={s.mono}>Two modes of work</p>
          <div className={s.registers}>
            <div className={s.register}>
              <span className={s.mono}>Systems</span>
              <span className={s.modeWord}>right</span>
            </div>
            <div className={s.register}>
              <span className={s.mono}>Experiments</span>
              <span className={s.modeWord}>wrong</span>
            </div>
          </div>
        </aside>

        <nav className={s.index} aria-label="On this page">
          <a href="#work">
            Selected work <span aria-hidden>↓</span>
          </a>
          <a href="#research">
            Research <span aria-hidden>↓</span>
          </a>
          <a href="#writing">
            Writing <span aria-hidden>↓</span>
          </a>
        </nav>
      </section>

      <section id="work" className={`wrap ${s.section}`} aria-labelledby="work-title" data-reveal>
        <header className={s.sectionHead}>
          <h2 id="work-title" className={s.sectionTitle}>
            Selected work
          </h2>
          <p className={s.mono}>01 — {String(selected.length).padStart(2, "0")}</p>
        </header>
        <div className={s.projects}>
          {selected.map((w, i) => {
            const Plate = w.plate ? plates[w.plate] : null;
            return (
              <article key={w.slug} className={s.project} data-project={w.slug}>
                <Link href={`/work/${w.slug}/`} className={s.projectLink} aria-labelledby={`p-${w.slug}`}>
                  <p className={s.mono}>
                    {String(i + 1).padStart(2, "0")} · {kind[w.kind]}
                  </p>
                  <h3 id={`p-${w.slug}`} className={s.projectTitle}>
                    {w.short}
                  </h3>
                  <p className={s.projectSummary}>{w.summary}</p>
                  {Plate && (
                    <div className={s.drawing} data-drawing>
                      <Plate />
                    </div>
                  )}
                  <span className={s.cta}>
                    View case study <span className={s.arrow} aria-hidden>→</span>
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
        <p className={s.more}>
          <Link href="/work/">All {getWork().length} projects, including Ferite, FRONTIER and the client work →</Link>
        </p>
      </section>

      <section id="research" className={`wrap ${s.section}`} aria-labelledby="research-title" data-reveal>
        <header className={s.sectionHead}>
          <h2 id="research-title" className={s.sectionTitle}>
            Research
          </h2>
          <p className={s.mono}>
            {programs.length} programs · {programs.reduce((n, p) => n + p.experiments.length, 0)} experiments recorded
          </p>
        </header>
        <div className={s.research}>
          {frontier && (
            <article className={s.featured} aria-labelledby="featured-title">
              <p className={s.mono}>Featured · {kind[frontier.kind]}</p>
              <h3 id="featured-title" className={s.projectTitle}>
                {frontier.short}
              </h3>
              <p className={s.projectSummary}>{frontier.summary}</p>
              <div className={s.nomogram}>
                <Nomogram fit={exp009.fit} bins={histogram(exp009.failing.map((r) => r[0]))} total={exp009.failing.length} />
                <p className={s.caption}>
                  exp-009 as an alignment chart: for each number of cases run before the first failure, the saving the
                  cost model promised against the wall-time saving fitted from the measurements.
                </p>
              </div>
              <ul className={s.links}>
                <li>
                  <Link href="/work/frontier/">Case study →</Link>
                </li>
                <li>
                  <Link href="/research/#frontier">Every experiment, with verdicts →</Link>
                </li>
                <li>
                  <Link href="/prototype/unwritten/">The exp-009 volume, in the archive →</Link>
                </li>
              </ul>
            </article>
          )}

          <div className={s.log}>
            <p className={s.mono}>Open questions</p>
            <ol className={s.questions}>
              {programs.map((p) => (
                <li key={p.slug}>
                  <Link href={`/research/#${p.slug}`} className={s.questionLink}>
                    <span className={s.mono}>{p.title}</span>
                    <span className={s.question}>{p.question}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className={s.mono}>Research log · latest entries</p>
            <ol className={s.entries}>
              {log.map((e) => (
                <li key={`${e.slug}-${e.id}`}>
                  <time className={s.mono} dateTime={e.date}>
                    {day.format(new Date(`${e.date}T00:00:00Z`))}
                  </time>
                  <span className={s.entryText}>
                    <span className={s.entryProgram}>
                      {e.program} · {e.id}
                    </span>
                    <span>{e.title}</span>
                  </span>
                  <span className={s.verdict} data-verdict={e.verdict}>
                    {e.verdict.replace("-", " ")}
                  </span>
                </li>
              ))}
            </ol>
            <p className={s.more}>
              <Link href="/research/">The full research log →</Link>
            </p>
          </div>
        </div>
      </section>

      <section id="writing" className={`wrap ${s.section}`} aria-labelledby="writing-title" data-reveal>
        <header className={s.sectionHead}>
          <h2 id="writing-title" className={s.sectionTitle}>
            Writing
          </h2>
          <p className={s.mono}>{writing.length} essays</p>
        </header>
        <ol className={s.essays}>
          {writing.map((w) => (
            <li key={w.slug}>
              <Link href={`/writing/${w.slug}/`} className={s.essay}>
                <span className={s.essayTitle}>{w.title}</span>
                <span className={s.essayDesc}>{w.description}</span>
                <time className={s.mono} dateTime={w.publishedAt.toISOString()}>
                  {month.format(w.publishedAt)} · {w.minutes} min
                </time>
                <span className={s.arrow} aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <HomeMotion />
    </div>
  );
}
