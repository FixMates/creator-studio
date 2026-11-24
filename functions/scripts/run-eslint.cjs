const { spawnSync } = require("node:child_process");
const path = require("node:path");

process.env.ESLINT_USE_FLAT_CONFIG = "false";
process.chdir(path.resolve(__dirname, ".."));

const eslintPackage = require.resolve("eslint/package.json");
const eslint = path.join(path.dirname(eslintPackage), "bin", "eslint.js");
const args = [eslint, "--ext", ".js,.ts", ".", ...process.argv.slice(2)];
if (process.platform === "win32") args.push("--rule", "linebreak-style: off");
const result = spawnSync(process.execPath, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
