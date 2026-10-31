import type { Metadata } from "next";
import { PageHead } from "@/components/chrome/PageHead";
import { ProjectIndex } from "@/components/home/ProjectIndex";
import { getWork } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "Production systems, independent projects, open source and research — each with what Keshav actually did.",
};

export default function WorkPage() {
  const work = getWork();
  return (
    <>
      <PageHead label="Work" aside={`${work.length} entries`} title="Work">
        <p>Production systems at jpteam / C1X, open source at Ostrium Labs, and projects of my own.</p>
        <p className="mono" style={{ color: "var(--ink-2)" }}>
          Every entry says what I did and what I didn&apos;t. Where something isn&apos;t finished, the page says how far it
          got.
        </p>
      </PageHead>
      <ProjectIndex work={work} label="All work" heading="Everything, with my part stated." />
    </>
  );
}
