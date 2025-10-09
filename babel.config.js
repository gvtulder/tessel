import child_process from "child_process";

function git(command) {
  return child_process.execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

export default {
  plugins: [
    ...(process.env["NODE_ENV"] != "production"
      ? []
      : ["transform-remove-console"]),
    [
      "transform-define",
      {
        ENV_VERSION: git("rev-parse --short HEAD"),
        ENV_INCLUDE_SERVICE_WORKER:
          process.env["NODE_ENV"] == "production" &&
          !process.env["SKIP_SERVICE_WORKER"],
      },
    ],
  ],
};
