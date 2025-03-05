import child_process from "child_process";

function git(command) {
  return child_process.execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

export default {
  plugins: [
    "transform-remove-console",
    ["transform-define", { VERSION: git("rev-parse --short HEAD") }],
  ],
};
