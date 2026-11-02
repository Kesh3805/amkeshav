import type { Metadata } from "next";
import { Unwritten } from "@/components/unwritten/Unwritten";

export const metadata: Metadata = {
  title: "The Unwritten",
  description: "Art-direction prototype: the first frame of an impossible classical library.",
  robots: { index: false, follow: false },
};

export default function UnwrittenPage() {
  return (
    <>
      {/* The poster is full-bleed; the site chrome would sit on top of the frame. */}
      <style>{`header[data-header]{display:none}`}</style>
      <Unwritten />
    </>
  );
}
