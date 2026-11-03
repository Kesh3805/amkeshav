import type { Metadata } from "next";
import { Unwritten } from "@/components/unwritten/Unwritten";
import { FrontierFolio } from "@/components/unwritten/folio/FrontierFolio";

export const metadata: Metadata = {
  title: "The Unwritten",
  description: "Art-direction prototype: the first frame of an impossible classical library.",
  robots: { index: false, follow: false },
};

export default function UnwrittenPage() {
  return (
    <>
      {/* The poster is full-bleed; the site header and footer would sit on and under the frame. */}
      <style>{`header[data-header],body>footer{display:none!important}`}</style>
      <Unwritten folio={<FrontierFolio />} />
    </>
  );
}
