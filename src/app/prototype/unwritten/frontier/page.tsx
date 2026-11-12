import type { Metadata } from "next";
import Link from "next/link";
import { FrontierFolio } from "@/components/unwritten/folio/FrontierFolio";
import s from "@/components/unwritten/folio/Folio.module.css";

export const metadata: Metadata = {
  title: "FRONTIER, exp-009 — The Unwritten",
  description: "Art-direction prototype: the FRONTIER volume open at exp-009, read flat.",
  robots: { index: false, follow: false },
};

/* The same folio the chamber opens, flat, for deep links and small screens. */
export default function FrontierFolioPage() {
  return (
    <>
      <style>{`header[data-header],body>footer{display:none!important}`}</style>
      {/* A div: the layout already wraps every page in <main id="main">. */}
      <div className={s.flatStage}>
        <h1 className="sr-only">FRONTIER, exp-009: the folio, read flat</h1>
        <Link className={s.close} href="/prototype/unwritten/">
          The chamber
        </Link>
        <FrontierFolio />
      </div>
    </>
  );
}
