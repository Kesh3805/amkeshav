import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import {
  programSchema,
  workSchema,
  writingSchema,
  type Program,
  type Work,
  type Writing,
} from "./schema";

const root = path.join(process.cwd(), "content");

function readDir(dir: string) {
  return fs
    .readdirSync(path.join(root, dir))
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const raw = fs.readFileSync(path.join(root, dir, f), "utf8");
      const { data, content } = matter(raw);
      return { file: `${dir}/${f}`, data, body: content };
    });
}

function parse<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, file: string, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid frontmatter in content/${file}: ${String(result.error)}`);
  }
  return result.data as T;
}

export type WorkEntry = Work & { body: string };
export type WritingEntry = Writing & { body: string; minutes: number };

export const getWork = cache((): WorkEntry[] =>
  readDir("work")
    .map(({ file, data, body }) => ({ ...parse<Work>(workSchema, file, data), body }))
    .sort((a, b) => a.order - b.order),
);

export const getWorkBySlug = (slug: string) => getWork().find((w) => w.slug === slug);

export const getWriting = cache((): WritingEntry[] =>
  readDir("writing")
    .map(({ file, data, body }) => ({
      ...parse<Writing>(writingSchema, file, data),
      body,
      minutes: Math.max(1, Math.round(body.split(/\s+/).length / 230)),
    }))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || a.title.localeCompare(b.title)),
);

export const getWritingBySlug = (slug: string) => getWriting().find((w) => w.slug === slug);

export const getPrograms = cache((): Program[] =>
  fs
    .readdirSync(path.join(root, "research"))
    .filter((f) => f.endsWith(".json"))
    .map((f) =>
      parse<Program>(programSchema, `research/${f}`, JSON.parse(fs.readFileSync(path.join(root, "research", f), "utf8"))),
    )
    .sort((a, b) => a.order - b.order),
);
