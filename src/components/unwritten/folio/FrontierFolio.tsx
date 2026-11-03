import { getExp009Nomogram, getExperiment, getPrograms } from "@/lib/content";
import { Folio } from "./Folio";

/** The FRONTIER volume open at exp-009, from the content loader (server only). */
export function FrontierFolio() {
  const program = getPrograms().find((p) => p.slug === "frontier");
  const experiment = getExperiment("frontier", "exp-009");
  if (!program || !experiment) throw new Error("content/research/frontier.json has no exp-009");
  return <Folio experiment={experiment} data={getExp009Nomogram()} repository={program.repository} />;
}
