import type { Exp009Nomogram, Experiment } from "@/lib/schema";
import { Nomogram } from "./NomogramChart";
import { histogram } from "./nomogram";
import s from "./Folio.module.css";

/*
  The FRONTIER volume, open at exp-009. Server-renderable, no state of its own: the chamber opens it in 3D
  (FolioOpener animates [data-folio-spread] and [data-folio-board]); the flat route and the deep link show
  the same DOM flat. Left page: the record. Right page: the instrument.
*/

export type FolioProps = {
  experiment: Experiment;
  data: Exp009Nomogram;
  repository: string;
  titleId?: string;
};

/** A deckled page: top, bottom and outer edges rough by up to 1.6 px (deterministic); the gutter straight. */
function deckle(outer: "left" | "right") {
  const n = 48;
  const j = (i: number, salt: number) => {
    const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return (1.6 * (v - Math.floor(v))).toFixed(2);
  };
  const at = (i: number) => `${((i / n) * 100).toFixed(3)}%`;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${at(i)} ${j(i, 1)}px`); // top, left → right
  for (let i = 0; i <= n; i++) pts.push(`calc(100% - ${outer === "right" ? j(i, 3) : 0}px) ${at(i)}`); // right, down
  for (let i = n; i >= 0; i--) pts.push(`${at(i)} calc(100% - ${j(i, 2)}px)`); // bottom, right → left
  for (let i = n; i >= 0; i--) pts.push(`${outer === "left" ? j(i, 3) : 0}px ${at(i)}`); // left, up
  return `polygon(${pts.join(",")})`;
}

const DECKLE_LEFT = deckle("left");
const DECKLE_RIGHT = deckle("right");

const longDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

export function Folio({ experiment: e, data, repository, titleId = "frontier-exp-009" }: FolioProps) {
  const bins = histogram(data.failing.map((r) => r[0]));
  const sourceHref = `${repository}/blob/main/${e.source}`;
  const [lo, hi] = data.savingMeasuredCi;
  const n = data.candidates.toLocaleString("en");

  return (
    <article className={s.spread} data-folio-spread="" aria-labelledby={titleId}>
      <div className={s.shadow} data-folio-shadow="" aria-hidden="true" />

      <div className={s.board} data-folio-board="">
        <section className={`${s.page} ${s.pageLeft}`} style={{ clipPath: DECKLE_LEFT }}>
          <div className={s.sheen} data-folio-sheen="" aria-hidden="true" />
          <header className={s.runningHead}>
            <span>Frontier</span>
            <span>
              {e.id} · {longDate(e.date)}
            </span>
          </header>

          <p className={s.kicker}>The question</p>
          <h2 className={s.title} id={titleId} tabIndex={-1}>
            {e.title}
          </h2>

          <dl className={s.entries}>
            <dt>Hypothesis</dt>
            <dd>{e.hypothesis}</dd>
            <dt>Setup</dt>
            <dd>{e.setup}</dd>
            <dt>Result</dt>
            <dd>{e.result}</dd>
          </dl>

          <div className={s.verdict}>
            <p className={s.stamp}>
              <span>Cost model refuted</span>
            </p>
            <p className={s.figures}>
              On the {data.fail.toLocaleString("en")} FAIL candidates: {pct1(data.savingModelled)} modelled,{" "}
              {pct1(data.savingMeasured)} measured [{pct1(lo).replace("%", "")}, {pct1(hi)}]
            </p>
          </div>

          <p className={s.lesson}>About {Math.round(data.fixedShare * 100)}% of a verification is fixed interpreter overhead.</p>
          <p className={s.body}>
            Early stopping preserved correctness: identical verdicts on {n}/{n} candidates. What failed is the
            assumption that charged units track real execution time, on this Windows DSL harness.
          </p>
          <p className={s.limits}>
            <span className={s.label}>Limitations</span> {e.limitations}
          </p>

          <footer className={s.colophon}>
            <p className={s.label}>Colophon</p>
            <dl>
              <dt>k, from receipts</dt>
              <dd>
                VerifierReceipt schema 0.2 records <code>verdict</code> and <code>cost_units</code>, not wall-clock time.
                Each candidate&rsquo;s k is <code>cost_units</code> / {data.chargePerCase}.
              </dd>
              <dt>Timings, from measurements</dt>
              <dd>
                exp-009 measurement records (<code>M-measurements.jsonl.gz</code>, <code>evaluation.json</code>): the
                median of three timed runs per mode, and the fit {data.fit.fixedMs} ms + {data.fit.perCaseMs} ms per case.
              </dd>
              <dt>Source</dt>
              <dd>
                <a href={sourceHref} rel="noopener">
                  Kesh3805/frontier · {e.source}
                </a>
              </dd>
            </dl>
          </footer>
        </section>

        {/* The board's outside: only ever seen in 3D, while the volume is still shut. */}
        <div className={s.cover} aria-hidden="true">
          <span>Frontier</span>
        </div>
      </div>

      <section className={`${s.page} ${s.pageRight}`} style={{ clipPath: DECKLE_RIGHT }} aria-label="Alignment chart">
        <div className={s.sheen} data-folio-sheen="" aria-hidden="true" />
        <header className={s.runningHead}>
          <span>An alignment chart</span>
          <span>{data.casesFull} cases per verification</span>
        </header>
        <Nomogram fit={data.fit} bins={bins} total={data.failing.length} />
      </section>
    </article>
  );
}
