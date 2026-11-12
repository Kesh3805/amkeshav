import { Home } from "@/components/home/Home";

/*
  The homepage: an engineering folio (docs/homepage/BRIEF.md, ChatGPT's brief of 12 Nov 2026, after Keshav
  asked for "something professional and nice" instead of extravagant UI). It carries its own header and
  footer, so the site's are hidden here.
*/
export default function Page() {
  return (
    <>
      <style>{`header[data-header],body>footer{display:none!important}html{background:#f3f3ee}`}</style>
      <Home />
    </>
  );
}
