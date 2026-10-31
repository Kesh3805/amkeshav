import Link from "next/link";
import { nav } from "@/lib/site";
import { NavLinks } from "./NavLinks";
import { HeaderMotion } from "./HeaderMotion";
import { ThemeToggle } from "./ThemeToggle";
import s from "./Header.module.css";

export function Header() {
  return (
    <header className={s.header} data-header>
      <HeaderMotion />
      <Link href="/" className={s.mark} aria-label="Keshav — home">
        <span className={s.markWord}>Keshav</span>
        <span className={s.markDot} aria-hidden />
      </Link>
      <nav aria-label="Primary" className={s.nav}>
        <NavLinks items={nav} />
        <ThemeToggle />
      </nav>
    </header>
  );
}
