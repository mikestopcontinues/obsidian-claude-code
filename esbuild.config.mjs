import esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const context = await esbuild.context({
  entryPoints: [join(__dirname, "src/main.ts")],
  bundle: true,
  outfile: join(__dirname, "main.js"),
  external: ["obsidian", "electron", "node-pty"],
  format: "cjs",
  target: "es2020",
  platform: "node",
  sourcemap: "inline",
  logLevel: "info",
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
}
