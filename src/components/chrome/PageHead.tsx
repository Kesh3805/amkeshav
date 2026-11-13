import type { ReactNode } from "react";
import s from "./PageHead.module.css";

/** Page opener in the folio's terms: a mono annotation row, the title, then an intro on the 12-column grid. */
export function PageHead({ label, aside, title, children }: { label: string; aside?: string; title: string; children?: ReactNode }) {
  return (
    <header className={`wrap ${s.head}`}>
      <div className={s.top}>
        <span className="label">{label}</span>
        {aside && <span className="label">{aside}</span>}
      </div>
      <h1 className={s.title}>{title}</h1>
      {children && <div className={s.intro}>{children}</div>}
    </header>
  );
}
