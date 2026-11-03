import Link from "next/link";
import s from "./Unwritten.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Unwritten() {
  return (
    <section className={s.frame}>
      {/* Plain <img>: static export, and next/image would not prefix the basePath. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.poster}
        src={`${base}/unwritten/hero-poster.webp`}
        alt="An impossible classical library: shelves rising out of sight, receding into shadow."
        width={1920}
        height={1080}
        fetchPriority="high"
      />
      <div className={s.copy}>
        <h1 className={s.name}>Keshav</h1>
        <p className={s.descriptor}>Engineer &amp; researcher</p>
        <Link className={s.enter} href="/work/">
          Enter the archive
        </Link>
      </div>
    </section>
  );
}
