import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, "frontend");

console.log("\x1b[31m%s\x1b[0m", "============================================================");
console.log("\x1b[31m%s\x1b[0m", "  BAYORA SHIELD — FULL-STACK DEVELOPMENT ENVIRONMENT");
console.log("\x1b[31m%s\x1b[0m", "  Backend API:  http://localhost:4000/api");
console.log("\x1b[31m%s\x1b[0m", "  Frontend Web: http://localhost:5173");
console.log("\x1b[31m%s\x1b[0m", "============================================================");

// 1. Backend Mock Server (port 4000)
const backend = spawn("npm", ["run", "mock"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: true,
});

// 2. Frontend Dev Server (port 5173 with proxy)
const frontend = spawn("npm", ["run", "dev"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\n[Bayora Shield] Stopping services...");
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
