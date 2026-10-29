import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

/** Resolve a node_modules binary across bun (.exe), npm (.cmd) and POSIX installs. */
export const bin = (name) => {
  const suffix = process.platform === "win32" ? ["exe", "cmd", ""] : [""];
  for (const ext of suffix) {
    const full = join(root, "node_modules", ".bin", ext ? `${name}.${ext}` : name);
    if (existsSync(full)) return full;
  }
  throw new Error(`Binary ${name} is missing; run make setup.`);
};

/** Run a node_modules binary, inheriting stdio. */
export const runBin = (name, args, options = {}) =>
  execFileSync(bin(name), args, { cwd: root, stdio: "inherit", ...options });
