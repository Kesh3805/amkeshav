import type { Metadata } from "next";
import { PageHead } from "@/components/chrome/PageHead";
import { WritingIndex } from "@/components/home/WritingIndex";
import { getWriting } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description: "Incident write-ups and design notes on read models, queues, durable streams, integrations and retrieval.",
};

export default function WritingPage() {
  const posts = getWriting();
  return (
    <>
      <PageHead label="Writing" aside={`${posts.length} essays`} title="Writing">
        <p>Incident write-ups and design notes, mostly about things that looked fine and weren&apos;t.</p>
        <p>Code in these posts is written for the post and simplified. None of it is an employer&apos;s source.</p>
      </PageHead>
      <WritingIndex posts={posts} />
    </>
  );
}
