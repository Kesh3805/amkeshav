import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mdx } from "@/components/mdx/Mdx";
import { getWork, getWriting, getWritingBySlug } from "@/lib/content";
import s from "./post.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getWriting().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const p = getWritingBySlug((await params).slug);
  return p ? { title: p.title, description: p.description, openGraph: { type: "article", title: p.title, description: p.description } } : {};
}

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function Post({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const post = getWritingBySlug(slug);
  if (!post) notFound();
  const related = getWork().filter((w) => post.relatedProjects.includes(w.slug));
  const others = getWriting().filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <article className={s.post}>
      <header className={s.head}>
        <div className={s.top}>
          <Link href="/writing" className="label link">
            ← Writing
          </Link>
          <span className="label">{post.tags.join(" · ")}</span>
        </div>
        <h1 className={s.title}>{post.title}</h1>
        <p className={s.dek}>{post.description}</p>
        <p className={s.meta}>
          <time dateTime={post.publishedAt.toISOString()}>{fmt.format(post.publishedAt)}</time>
          {post.updatedAt && <span>Updated {fmt.format(post.updatedAt)}</span>}
          <span>{post.minutes} min read</span>
        </p>
      </header>

      <div className={s.body}>
        <Mdx source={post.body} />
      </div>

      <footer className={s.foot}>
        {related.length > 0 && (
          <div>
            <span className="label">From the work</span>
            {related.map((w) => (
              <Link key={w.slug} href={`/work/${w.slug}`} className={s.footLink}>
                {w.title} →
              </Link>
            ))}
          </div>
        )}
        <div>
          <span className="label">More writing</span>
          {others.map((p) => (
            <Link key={p.slug} href={`/writing/${p.slug}`} className={s.footLink}>
              {p.title}
            </Link>
          ))}
        </div>
      </footer>
    </article>
  );
}
