import { MDXRemote } from "next-mdx-remote-client/rsc";
import type { MDXComponents } from "mdx/types";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { ImpactPlate } from "@/components/plates/Plates";
import { EdgeList, Flow, QueueIdentity, ReadModel, SseDurability } from "./Figures";
import s from "./Prose.module.css";

function Pre({ children, ...rest }: { children?: ReactNode }) {
  const child = isValidElement(children) ? (children as ReactElement<{ className?: string; children?: ReactNode }>) : null;
  if (child?.props.className?.includes("language-mermaid")) {
    return <EdgeList source={String(child.props.children ?? "")} />;
  }
  return (
    <pre className={s.pre} tabIndex={0} {...rest}>
      {children}
    </pre>
  );
}

const components: MDXComponents = {
  pre: Pre,
  table: (p) => (
    <div className={s.tableWrap}>
      <table {...p} />
    </div>
  ),
  Flow,
  SseDurability,
  ReadModel,
  QueueIdentity,
  ImpactGraph: () => (
    <figure className={s.plateFig}>
      <div className={s.plate}>
        <ImpactPlate />
      </div>
      <figcaption className="label">The auth-bypass fixture: one seed, six impacted elements, two decoys.</figcaption>
    </figure>
  ),
};

export function Mdx({ source }: { source: string }) {
  return (
    <div className={s.prose}>
      <MDXRemote
        source={source.replace(/\]\(\/projects\//g, "](/work/")}
        components={components}
        options={{ disableImports: true, mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
      />
    </div>
  );
}
