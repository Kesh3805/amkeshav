import { site } from "@/lib/site";
import s from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={`wrap ${s.footer}`}>
      <p className={s.name}>Keshav</p>
      <ul className={s.contact}>
        <li>
          <a href={`mailto:${site.email}`} className="link">
            {site.email}
          </a>
        </li>
        <li>
          <a href={site.github} className="link">
            GitHub ↗
          </a>
        </li>
        <li>
          <a href={site.linkedin} className="link">
            LinkedIn ↗
          </a>
        </li>
      </ul>
      <p className={s.colophon}>Set in IBM Plex Sans and JetBrains Mono. No cookies, no analytics.</p>
    </footer>
  );
}
