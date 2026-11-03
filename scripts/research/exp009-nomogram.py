"""The exp-009 nomogram's data, from FRONTIER's own measurements and nothing else.
Reads results/exp-009/{M-measurements.jsonl.gz, evaluation.json} from a FRONTIER checkout and writes
content/research/data/frontier-exp009.json (a subfolder, so getPrograms does not
read it as a program):
  - the fit (fixed seconds + seconds per case) and the headline savings, verbatim from evaluation.json
  - for every FAIL candidate, the cases its early-stop verification ran (charge / 0.005 CU, the receipt's
    cost_units) and the median of its three timed runs in each mode
Usage: python scripts/research/exp009-nomogram.py <frontier-checkout>"""
import gzip, json, os, statistics, sys
from collections import defaultdict

src = os.path.join(sys.argv[1], "results", "exp-009")
ev = json.load(open(os.path.join(src, "evaluation.json"), encoding="utf-8"))["M"]
UNIT = 0.005  # CU per case run (exp-009 protocol; a full 199-case verification charges 0.995)

runs = defaultdict(lambda: {"E": [], "F": [], "k": set(), "verdict": set()})
with gzip.open(os.path.join(src, "M-measurements.jsonl.gz"), "rt", encoding="utf-8") as f:
    for line in f:
        m = json.loads(line)
        r = runs[m["id"]]
        r[m["mode"]].append(m["wall_s"])
        r["verdict"].add(m["verdict"])
        if m["mode"] == "E":
            r["k"].add(round(m["charge"] / UNIT))

fails = []
for cid, r in sorted(runs.items()):
    assert len(r["verdict"]) == 1 and len(r["k"]) == 1, cid  # identical verdicts and charges (M5)
    if r["verdict"] == {"FAIL"}:
        fails.append([next(iter(r["k"])), round(statistics.median(r["E"]) * 1000, 2), round(statistics.median(r["F"]) * 1000, 2)])

out = {
    "source": "FRONTIER results/exp-009 (M-measurements.jsonl.gz, evaluation.json)",
    "casesFull": 199,
    "chargePerCase": UNIT,
    "fit": {"fixedMs": round(ev["fit_seconds"]["a"] * 1000, 2), "perCaseMs": round(ev["fit_seconds"]["b_per_case"] * 1000, 4)},
    "candidates": ev["candidates"],
    "fail": ev["fail"],
    "savingModelled": ev["S_mod_fail"],
    "savingMeasured": ev["S_meas_fail"],
    "savingMeasuredCi": ev["S_meas_fail_ci"],
    "fixedShare": ev["fixed_share"],
    "columns": ["k", "medianWallEarlyMs", "medianWallFullMs"],
    "failing": sorted(fails),
}
assert len(fails) == ev["fail"], (len(fails), ev["fail"])
dst = os.path.join("content", "research", "data", "frontier-exp009.json")
with open(dst, "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
ks = sorted(k for k, _, _ in fails)
print(f"wrote {dst}: {len(fails)} failing candidates, median k {statistics.median(ks)}, max k {ks[-1]}, "
      f"{os.path.getsize(dst)} bytes")
