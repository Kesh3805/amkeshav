import Link from "next/link";
import { Closing } from "@/components/home/Closing";
import { Commitment } from "@/components/home/Commitment";
import { GraphShowcase } from "@/components/home/GraphShowcase";
import { GstShowcase } from "@/components/home/GstShowcase";
import { Opening } from "@/components/home/Opening";
import { ProjectIndex } from "@/components/home/ProjectIndex";
import { TallyField } from "@/components/home/TallyField";
import { WritingIndex } from "@/components/home/WritingIndex";
import { getWork, getWriting } from "@/lib/content";

const SHOWCASED = ["gst-platform", "reviewgraph", "temporal-compute"];

export default function Home() {
  const work = getWork();
  const rest = work.filter((w) => !SHOWCASED.includes(w.slug));
  return (
    <>
      <Opening names={["GST platform", "ReviewGraph", "Temporal Compute"]} more={rest.length} />
      <h2 className="sr-only">Selected work</h2>
      <GstShowcase />
      <GraphShowcase />
      <TallyField />
      <Commitment />
      <ProjectIndex
        work={rest}
        aside={
          <>
            I also built something that{" "}
            <Link href="/work/sonicmirror" className="link">
              roasts your Spotify taste
            </Link>
            .
          </>
        }
      />
      <WritingIndex posts={getWriting()} />
      <Closing />
    </>
  );
}
