import Link from "next/link";
import type { ReactNode } from "react";
import { ChamberLayer } from "./ChamberLayer";
import { FolioOpener } from "./folio/FolioOpener";
import s from "./Unwritten.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** `folio`: the FRONTIER volume's open spread, opened from the book on the reading desk. */
export function Unwritten({ folio }: { folio?: ReactNode }) {
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
      {/* WebGL chamber over the poster, under the copy; client-only, mounts after load, fades in when ready. */}
      <ChamberLayer base={base} />
      <div className={s.copy}>
        <h1 className={s.name}>Keshav</h1>
        <p className={s.descriptor}>Engineer &amp; researcher</p>
        <Link className={s.enter} href="/work/">
          Enter the archive
        </Link>
        {/* Narrow screens: the desk sits behind this copy, so the book is opened from here instead. */}
        {folio && (
          <a className={s.volume} href="#frontier">
            Open the FRONTIER volume
          </a>
        )}
      </div>
      {folio && <FolioOpener>{folio}</FolioOpener>}
    </section>
  );
}
