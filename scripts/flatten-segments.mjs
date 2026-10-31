// The static export writes prefetch segments as nested files (`__next.work/$d$slug/__PAGE__.txt`),
// while the client router requests them flat (`__next.work.$d$slug.__PAGE__.txt`). Copy each nested
// segment to its flat name so any static host serves both without rewrite rules.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
let copied = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) flatten(full, dir, entry.name);
    else if (entry.name !== "_next") walk(full);
  }
}

function flatten(dir, parent, prefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) flatten(full, parent, name);
    else {
      fs.copyFileSync(full, path.join(parent, name));
      copied++;
    }
  }
}

walk(root);
console.log(`flattened ${copied} segment files`);
