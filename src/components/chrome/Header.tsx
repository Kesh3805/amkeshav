import Link from "next/link";
import { nav } from "@/lib/site";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import s from "./Header.module.css";

/* The folio's standard header (docs/homepage/BRIEF.md §G): the name, four sections, the theme. */
export function Header() {
  return (
    <header className={s.header} data-header>
      <div className={`wrap ${s.inner}`}>
        <Link href="/" className={s.mark}>
          Keshav
        </Link>
        <nav aria-label="Primary" className={s.nav}>
          <NavLinks items={nav} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
