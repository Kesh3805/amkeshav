import { z } from "zod";

export const stageStatus = z.enum(["built", "partial", "design", "planned"]);

export const workSchema = z.object({
  title: z.string(),
  short: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["professional", "independent", "open-source", "research"]),
  org: z.string().optional(),
  role: z.string(),
  period: z.string().optional(),
  summary: z.string().max(260),
  status: z.object({
    label: z.string(),
    tone: z.enum(["built", "partial", "negative"]),
  }),
  plate: z.enum(["readmodel", "crates", "impact", "intervals", "tally", "gates"]).optional(),
  order: z.number().int(),
  featured: z.boolean().default(false),
  stack: z.array(z.string()).default([]),
  research: z.string().optional(),
  facts: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  maturity: z
    .array(z.object({ name: z.string(), status: stageStatus, evidence: z.string() }))
    .default([]),
});

export const writingSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  relatedProjects: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export const verdict = z.enum([
  "pass",
  "fail",
  "mixed",
  "supported",
  "refuted",
  "inconclusive",
  "superseded",
  "not-run",
]);

export const experimentSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().optional(),
  kind: z.string(),
  hypothesis: z.string(),
  setup: z.string(),
  baseline: z.string(),
  measurement: z.string(),
  result: z.string(),
  effect: z
    .object({
      estimate: z.number(),
      low: z.number(),
      high: z.number(),
      unit: z.string(),
      label: z.string(),
    })
    .optional(),
  verdict,
  limitations: z.string(),
  source: z.string(),
});

export const programSchema = z.object({
  title: z.string(),
  slug: z.string(),
  order: z.number(),
  repository: z.string().url(),
  program: z.string(),
  question: z.string(),
  summary: z.string(),
  architecture: z.array(z.string()),
  maturity: z.string(),
  experiments: z.array(experimentSchema),
  next: z.array(z.string()),
  reproduce: z.array(z.string()),
});

export type Work = z.infer<typeof workSchema>;
export type Writing = z.infer<typeof writingSchema>;
export type Program = z.infer<typeof programSchema>;
export type Experiment = z.infer<typeof experimentSchema>;
export type Verdict = z.infer<typeof verdict>;
