"""Merge the raw research sweeps into one de-duplicated library.

    python scripts/research/merge.py

Reads docs/research/raw/*.json (sites) and libraries.json (tools), normalises URLs, merges
duplicates while keeping every source a site appeared in, and writes:
  docs/research/library.json   sites, one record each, with all sources
  docs/research/library.csv    the same, flattened for spreadsheets
  docs/research/tools.json     UI / motion / 3D libraries and marketplaces
  docs/research/stats.json     counts by source, category and tag
"""
import csv
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "docs" / "research" / "raw"
OUT = ROOT / "docs" / "research"

# Words that mark a note as gallery boilerplate rather than an observation about the site.
THIN = re.compile(r"(curated by|entry|not individually reviewed|featured on|listed on|gallery)", re.I)


def norm(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if "://" not in url:
        url = "https://" + url
    p = urlsplit(url)
    host = p.netloc.lower().removeprefix("www.")
    path = re.sub(r"/+$", "", p.path)
    return f"{host}{path}".lower()


def load(name: str):
    try:
        data = json.loads((RAW / name).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"skip {name}: {e}")
        return []
    return data if isinstance(data, list) else data.get("sites") or data.get("items") or []


sites: dict[str, dict] = {}
per_file = {}
for f in sorted(RAW.glob("*.json")):
    if f.name in ("libraries.json", "chatgpt-libraries.json"):
        continue
    rows = load(f.name)
    per_file[f.name] = len(rows)
    for r in rows:
        key = norm(r.get("url", ""))
        if not key:
            continue
        rec = sites.setdefault(
            key,
            {
                "name": r.get("name") or key,
                "url": r.get("url"),
                "category": r.get("category") or "other",
                "year": r.get("year"),
                "tags": [],
                "notes": [],
                "sources": [],
                "sweeps": [],
                "mechanic": None,
                "region": None,
            },
        )
        for t in r.get("tags") or []:
            t = str(t).strip().lower()
            if t and t not in rec["tags"]:
                rec["tags"].append(t)
        note = (r.get("notable") or "").strip()
        if note and note not in rec["notes"]:
            rec["notes"].append(note)
        src = (r.get("source") or "").strip()
        if src and src not in rec["sources"]:
            rec["sources"].append(src)
        if f.stem not in rec["sweeps"]:
            rec["sweeps"].append(f.stem)
        if not rec["mechanic"] and r.get("mechanic"):
            rec["mechanic"] = r["mechanic"]
        if not rec["region"] and r.get("region"):
            rec["region"] = r["region"]
        if not rec["year"] and r.get("year"):
            rec["year"] = r.get("year")
        if rec["category"] == "other" and r.get("category"):
            rec["category"] = r["category"]

library = []
for key, rec in sites.items():
    rich = [n for n in rec["notes"] if not THIN.search(n)]
    rec["depth"] = "described" if rich else "catalogued"
    # Source confidence only: how well-documented and independently discovered a site is.
    # It measures discoverability, not originality (ChatGPT's point) — originality is scored separately.
    rec["signal"] = len(rec["sources"]) + len(rec["sweeps"]) - 1 + (2 if rich else 0) + (2 if rec["mechanic"] else 0)
    rec["key"] = key
    library.append(rec)
library.sort(key=lambda r: (-r["signal"], r["name"].lower()))

tools = load("libraries.json") + load("chatgpt-libraries.json")
seen, tools_out = set(), []
for t in tools:
    k = norm(t.get("url", ""))
    if k and k not in seen:
        seen.add(k)
        tools_out.append(t)

(OUT / "library.json").write_text(json.dumps(library, indent=1, ensure_ascii=False), encoding="utf-8")
(OUT / "tools.json").write_text(json.dumps(tools_out, indent=1, ensure_ascii=False), encoding="utf-8")
with (OUT / "library.csv").open("w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["name", "url", "category", "region", "year", "depth", "signal", "mechanic", "tags", "sources", "notes"])
    for r in library:
        w.writerow([r["name"], r["url"], r["category"], r["region"] or "", r["year"] or "", r["depth"], r["signal"], r["mechanic"] or "",
                    "; ".join(r["tags"]), " | ".join(r["sources"]), " | ".join(r["notes"])])

stats = {
    "raw_records_per_sweep": per_file,
    "raw_records_total": sum(per_file.values()),
    "unique_sites": len(library),
    "unique_tools": len(tools_out),
    "described": sum(r["depth"] == "described" for r in library),
    "catalogued_only": sum(r["depth"] == "catalogued" for r in library),
    "in_multiple_sources": sum(len(r["sources"]) > 1 for r in library),
    "with_mechanic": sum(bool(r["mechanic"]) for r in library),
    "by_category": Counter(r["category"] for r in library).most_common(),
    "top_tags": Counter(t for r in library for t in r["tags"]).most_common(40),
}
(OUT / "stats.json").write_text(json.dumps(stats, indent=1, ensure_ascii=False), encoding="utf-8")
print(json.dumps({k: stats[k] for k in ("raw_records_per_sweep", "raw_records_total", "unique_sites", "unique_tools", "described", "catalogued_only", "in_multiple_sources", "with_mechanic")}, indent=1))
