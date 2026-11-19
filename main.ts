// Platinum Road — entrypoint.
// Copies app/ and screenshots/ from this repository into the output directory
// and writes output/dossier.json with the kit's buildDossier library, so the
// sealed gate can check the guide exactly as the program hands it in.
//
// Usage (outside the grader):  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cp, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");

await mkdir(outputDir, { recursive: true });
await cp(appDir, join(outputDir, "app"), { recursive: true });
await cp(shotsDir, join(outputDir, "screenshots"), { recursive: true });

// Build the dossier from the copied output, so the dossier the gate rebuilds
// from /output is byte for byte the one written here.
const dossier = buildDossier(outputDir, { text_max_bytes: 163840 });
await writeFile(join(outputDir, "dossier.json"), dossier);

console.log(`Wrote ${outputDir}/dossier.json`);
