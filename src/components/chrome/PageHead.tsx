import type { ReactNode } from "react";
import s from "./PageHead.module.css";

/** Page opener: a label row, then a title that unfolds along the width axis. */
export function PageHead({ label, aside, title, children }: { label: string; aside?: string; title: string; children?: ReactNode }) {
  return (
    <header className={s.head}>
      <div className={s.top}>
        <span className="label">{label}</span>
        {aside && <span className="label">{aside}</span>}
      </div>
      <h1 className={s.title} style={{ "--chars": title.length + 0.4 } as React.CSSProperties}>
        {title}
        <span className={s.dot} aria-hidden />
      </h1>
      {children && <div className={s.intro}>{children}</div>}
    </header>
  );
}
