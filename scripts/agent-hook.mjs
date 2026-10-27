import { execSync } from "node:child_process";
import fs from "node:fs";

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

async function main() {
  const mode = process.argv[2] ?? "post-edit";
  const rawInput = await readStdin();
  let payload = {};
  if (rawInput.trim()) {
    try {
      payload = JSON.parse(rawInput);
    } catch {
      // Non-JSON input
    }
  }

  if (mode === "post-edit") {
    // Run fast formatter/linter on changed file only
    const filePath =
      payload.tool_input?.file_path ||
      payload.arguments?.filePath ||
      payload.arguments?.path ||
      process.argv[3];
    if (filePath && fs.existsSync(filePath)) {
      try {
        execSync(`node_modules/.bin/biome check --write "${filePath}"`, {
          stdio: "inherit",
          timeout: 5000,
        });
      } catch {
        // Do not block agent on formatting warnings
      }
    }
    process.exit(0);
  }

  if (mode === "stop") {
    if (payload.stop_hook_active === true) process.exit(0);
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    if (!dirty) process.exit(0);

    try {
      execSync("make verify", { stdio: "pipe", timeout: 120000 });
      process.exit(0);
    } catch (err) {
      const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.split("\n").slice(-40).join("\n");
      console.error(out);
      process.exit(2);
    }
  }
}

main().catch(() => process.exit(0));
