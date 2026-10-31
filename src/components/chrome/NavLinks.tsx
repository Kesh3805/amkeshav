"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./Header.module.css";

export function NavLinks({ items }: { items: readonly { label: string; href: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className={s.links}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link href={item.href} className={s.link} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
