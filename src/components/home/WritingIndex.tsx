import Link from "next/link";
import type { WritingEntry } from "@/lib/content";
import s from "./WritingIndex.module.css";

const fmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/* Every essay as a ruled list of title, description and date, the homepage's register at full length. */
export function WritingIndex({ posts }: { posts: WritingEntry[] }) {
  return (
    <div className="wrap">
      <ol className={s.list}>
        {posts.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/writing/${p.slug}/`} className={s.item}>
              <span className={`label ${s.num}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.title}>{p.title}</span>
              <span className={s.desc}>{p.description}</span>
              <span className={`label ${s.meta}`}>
                <time dateTime={p.publishedAt.toISOString()}>{fmt.format(p.publishedAt)}</time> · {p.minutes} min
                <span className={s.tags}>{p.tags.slice(0, 2).join(" · ")}</span>
              </span>
              <span className={s.arrow} aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
