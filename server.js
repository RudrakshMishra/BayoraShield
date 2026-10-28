import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.PORT = process.env.PORT || "4000";

console.log(`[Bayora Shield] Launching unified full-stack server on port ${process.env.PORT}...`);
console.log(`[Bayora Shield] Serving frontend website + backend APIs on http://localhost:${process.env.PORT}`);

const child = spawn("npx", ["tsx", "mock/server.ts"], {
  cwd: path.join(__dirname, "frontend"),
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
