import { site } from "@/lib/site";
import s from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={s.footer}>
      <p>Set in Anybody, Newsreader and JetBrains Mono. Built with Next.js and GSAP. No cookies, no analytics.</p>
      <p>
        <a href={site.github} className="link">
          Source and everything else on GitHub
        </a>{" "}
        · © {new Date().getFullYear()} Keshav
      </p>
    </footer>
  );
}
