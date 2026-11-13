import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/chrome/PageHead";
import { site } from "@/lib/site";
import s from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Keshav is a software engineer at jpteam / C1X Inc. and a co-maintainer at Ostrium Labs.",
};

const timeline = [
  { when: "May 2026 — now", what: "Software Engineer, jpteam / C1X Inc.", note: "Full-time" },
  { when: "Aug 2025 — Apr 2026", what: "Software Engineering Intern, jpteam / C1X Inc.", note: "Internship" },
];

const stack = [
  ["Languages", "TypeScript, JavaScript, Python, Rust, Go, Java, SQL, Solidity"],
  ["Backend", "NestJS, FastAPI, Spring Boot"],
  ["Frontend", "React, Next.js, React Native, Angular"],
  ["Data", "PostgreSQL, MySQL, MongoDB, Redis, pgvector, ClickHouse"],
  ["AI / ML", "LlamaIndex, Gemini, PyTorch, HuggingFace Transformers, Grad-CAM, SHAP"],
  ["Queues", "BullMQ, Apache Kafka, Redpanda"],
  ["Cloud & ops", "GCP, AWS S3, Docker, GitHub Actions, Turborepo, Neon, Vercel"],
  ["Testing", "Jest, Testcontainers, Allure, pytest, DVC"],
];

export default function AboutPage() {
  return (
    <>
      <PageHead label="About" aside="Keshav" title="About">
        <p>
          I&apos;m Keshav. I build production backends at jpteam / C1X Inc., and on my own time I build and test things
          whose answers I don&apos;t know yet.
        </p>
      </PageHead>

      <div className={`wrap ${s.grid}`}>
        <section className={s.block} aria-labelledby="a-build">
          <h2 id="a-build" className={s.h}>
            What I build
          </h2>
          <p>
            At work: production backends across FinTech compliance, document AI, enterprise conversational AI and
            high-concurrency campaign platforms. Most of that time has gone into a{" "}
            <Link href="/work/gst-platform" className="link">
              GST compliance and document-AI platform
            </Link>
            , where I&apos;m a primary contributor to the core domain service and the extraction worker — ledgers with
            correct tax math, reconciliation with the government portal, return filing, durable notifications, and the
            boundary between tenants.
          </p>
          <p>
            On my own time, things one step further out: a{" "}
            <Link href="/work/reviewgraph" className="link">
              pull-request reviewer built on a code graph
            </Link>
            , a{" "}
            <Link href="/work/bara" className="link">
              memory architecture
            </Link>{" "}
            where retrieval is a decision rather than a reflex, and co-maintaining{" "}
            <Link href="/work/loams" className="link">
              Loams
            </Link>{" "}
            at Ostrium Labs.
          </p>
        </section>

        <section className={s.block} aria-labelledby="a-attention">
          <h2 id="a-attention" className={s.h}>
            How the work changed
          </h2>
          <p>
            I started with the parts of a system that decide whether it&apos;s correct under load and under failure, and
            kept running into questions underneath them that don&apos;t have answers yet: when computation is worth doing,
            how much verification a result needs, what a deadline does to the value of an answer.
          </p>
          <p>
            A scheduler for jobs whose value depends on when they finish turned into{" "}
            <Link href="/work/temporal-compute" className="link">
              Temporal Compute
            </Link>
            , whose first registered experiment lost to EDF. A question about verified results under a fixed budget turned
            into{" "}
            <Link href="/work/frontier" className="link">
              FRONTIER
            </Link>
            . The most useful thing I&apos;ve learned to do with an experiment is to write down what it should show before
            it runs, and keep the result on the page when it doesn&apos;t.
          </p>
        </section>

        <section className={s.block} aria-labelledby="a-now">
          <h2 id="a-now" className={s.h}>
            Now
          </h2>
          <ul className={s.now}>
            <li>
              <strong>ReviewGraph</strong> — the deterministic half is built. Next is the evidence verifier, which has to
              exist before the system is allowed to publish a finding on its own.
            </li>
            <li>
              <strong>FRONTIER</strong> — re-running the allocation comparisons under measured costs, after exp-009 showed
              most of a verification is fixed overhead.
            </li>
            <li>
              <strong>Temporal Compute</strong> — Generation II is registered and waiting on its execution freeze.
            </li>
          </ul>
          <p className="label">As of 28 October 2026</p>
        </section>

        <section className={s.block} aria-labelledby="a-time">
          <h2 id="a-time" className={s.h}>
            Where
          </h2>
          <ol className={s.timeline}>
            {timeline.map((t) => (
              <li key={t.when}>
                <span className="label">{t.when}</span>
                <span>{t.what}</span>
                <span className={s.note}>{t.note}</span>
              </li>
            ))}
            <li>
              <span className="label">Ongoing</span>
              <span>Co-maintainer, Ostrium Labs</span>
              <span className={s.note}>Loams · Ferite docs and brand</span>
            </li>
          </ol>
        </section>

        <section className={`${s.block} ${s.wide}`} aria-labelledby="a-stack">
          <h2 id="a-stack" className={s.h}>
            Tools I&apos;ve shipped with
          </h2>
          <dl className={s.stack}>
            {stack.map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${s.block} ${s.wide}`} aria-labelledby="a-contact">
          <h2 id="a-contact" className={s.h}>
            Contact
          </h2>
          <p className={s.contact}>
            <a href={`mailto:${site.email}`} className={`link ${s.mail}`}>
              {site.email}
            </a>
          </p>
          <p className={s.elsewhere}>
            <a href={site.github} className="link">
              GitHub ↗
            </a>
            <a href={site.linkedin} className="link">
              LinkedIn ↗
            </a>
            <a href={site.ostrium} className="link">
              Ostrium Labs ↗
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
