import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/chrome/PageHead";
import { Maturity } from "@/components/mdx/Maturity";
import { Mdx } from "@/components/mdx/Mdx";
import { plates } from "@/components/plates/Plates";
import { getWork, getWorkBySlug } from "@/lib/content";
import s from "./case.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getWork().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const w = getWorkBySlug((await params).slug);
  return w ? { title: w.title, description: w.summary } : {};
}

const kind = { professional: "Production", independent: "Independent", "open-source": "Open source", research: "Research" } as const;

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const w = getWorkBySlug(slug);
  if (!w) notFound();
  const all = getWork();
  const i = all.findIndex((x) => x.slug === slug);
  const next = all[(i + 1) % all.length];
  const Plate = w.plate ? plates[w.plate] : null;

  return (
    <article>
      <PageHead label={`Work · ${kind[w.kind]}${w.org ? ` · ${w.org}` : ""}`} aside={w.period} title={w.short}>
        <p>{w.summary}</p>
        <dl className={s.meta}>
          <div>
            <dt className="label">My part</dt>
            <dd>{w.role}</dd>
          </div>
          <div>
            <dt className="label">State</dt>
            <dd>
              <span className={s.tone} data-tone={w.status.tone} aria-hidden /> {w.status.label}
            </dd>
          </div>
          {w.links.length > 0 && (
            <div>
              <dt className="label">Links</dt>
              <dd className={s.links}>
                {w.links.map((l) =>
                  l.href.startsWith("/") ? (
                    <Link key={l.href} href={l.href} className="link">
                      {l.label}
                    </Link>
                  ) : (
                    <a key={l.href} href={l.href} className="link">
                      {l.label} ↗
                    </a>
                  ),
                )}
              </dd>
            </div>
          )}
          {w.links.length === 0 && w.kind === "professional" && (
            // Release ruling (b), 12 Nov 2026: say what evidence is public, rather than leave the reader to guess.
            <div>
              <dt className="label">Links</dt>
              <dd>None public — professional work{w.org ? ` at ${w.org}` : ""}</dd>
            </div>
          )}
        </dl>
      </PageHead>

      {Plate && (
        <div className="wrap">
          <div className={s.plate}>
            <Plate />
          </div>
        </div>
      )}

      {w.facts.length > 0 && (
        <ul className={`wrap ${s.facts}`} aria-label="Key figures">
          {w.facts.map((f) => (
            <li key={f.label}>
              <span className={s.factValue}>{f.value}</span>
              <span className={s.factLabel}>{f.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={`wrap ${s.body}`}>
        <aside className={s.aside}>
          <span className="label">Stack</span>
          <ul>
            {w.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </aside>
        <div className={s.main}>
          <Mdx source={w.body} />
          <div className={s.maturity}>
            <Maturity stages={w.maturity} />
          </div>
          {w.deepDive && (
            <aside className={s.deepDive} aria-label="Experimental deep-dive">
              <span className="label">Deep-dive</span>
              <Link href={w.deepDive.href} className={s.deepDiveLink}>
                {w.deepDive.label} <span aria-hidden>→</span>
              </Link>
              <p className={s.deepDiveNote}>{w.deepDive.note}</p>
            </aside>
          )}
        </div>
      </div>

      <nav className={`wrap ${s.next}`} aria-label="Next case study">
        <Link href={`/work/${next.slug}/`} className={s.nextLink}>
          <span className="label">Next case study · {kind[next.kind]}</span>
          <span className={s.nextTitle}>
            {next.short} <span className={s.arrow} aria-hidden>→</span>
          </span>
          <span className={s.nextSummary}>{next.summary}</span>
        </Link>
        <Link href="/work/" className="link">
          All work
        </Link>
      </nav>
    </article>
  );
}
