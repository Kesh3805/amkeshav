import Link from "next/link";
import type { WritingEntry } from "@/lib/content";
import s from "./WritingIndex.module.css";

const fmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export function WritingIndex({ posts, heading = true }: { posts: WritingEntry[]; heading?: boolean }) {
  return (
    <section className={s.section} aria-labelledby={heading ? "writing-title" : undefined}>
      {heading && (
        <>
          <div className={s.top}>
            <span className="label">05 — Writing</span>
            <Link href="/writing" className="label link">
              All writing →
            </Link>
          </div>
          <div className={s.head}>
            <h2 id="writing-title" className={s.title}>
              Notes from the parts that broke.
            </h2>
            <p className={s.dek}>
              Incident write-ups and design notes. The code in them is written for the post; none of it is an
              employer&apos;s source.
            </p>
          </div>
        </>
      )}
      <ol className={s.list}>
        {posts.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/writing/${p.slug}`} className={s.item}>
              <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.postTitle}>{p.title}</span>
              <span className={s.desc}>{p.description}</span>
              <span className={s.meta}>
                <time dateTime={p.publishedAt.toISOString()}>{fmt.format(p.publishedAt)}</time>
                <span>{p.minutes} min</span>
                <span>{p.tags.slice(0, 2).join(" · ")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
