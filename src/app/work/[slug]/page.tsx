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
        </dl>
      </PageHead>

      {Plate && (
        <div className={s.plate}>
          <Plate />
        </div>
      )}

      {w.facts.length > 0 && (
        <ul className={s.facts} aria-label="Key figures">
          {w.facts.map((f) => (
            <li key={f.label}>
              <span className={s.factValue}>{f.value}</span>
              <span className={s.factLabel}>{f.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={s.body}>
        <aside className={s.aside}>
          <span className="label">Stack</span>
          <ul>
            {w.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </aside>
        <div>
          <Mdx source={w.body} />
          <div className={s.maturity}>
            <Maturity stages={w.maturity} />
          </div>
        </div>
      </div>

      <nav className={s.next} aria-label="Next case study">
        <span className="label">Next</span>
        <Link href={`/work/${next.slug}`} className={s.nextLink}>
          {next.short} <span aria-hidden>→</span>
        </Link>
      </nav>
    </article>
  );
}
