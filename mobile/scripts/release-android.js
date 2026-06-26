#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const releaseProfiles = {
  preview: {
    artifact: "APK",
    label: "internal-preview",
    command: ["eas-cli@latest", "build", "--platform", "android", "--profile", "preview"]
  },
  production: {
    artifact: "AAB",
    label: "play-production",
    command: ["eas-cli@latest", "build", "--platform", "android", "--profile", "production"]
  }
};

const profile = process.argv[2];
const release = releaseProfiles[profile];

if (!release) {
  console.error("Choose a release profile: preview or production.");
  process.exit(1);
}

console.log(`Tradia Android release: ${release.label}`);
console.log(`Expected artifact: ${release.artifact}`);
console.log(`EAS profile: ${profile}`);
console.log(`Command: npx ${release.command.join(" ")}`);

const result = spawnSync("npx", release.command, {
  env: {
    ...process.env,
    TRADIA_ANDROID_RELEASE_TYPE: release.label,
    TRADIA_ANDROID_ARTIFACT: release.artifact,
    TRADIA_EAS_PROFILE: profile,
    TRADIA_RELEASE_STARTED_AT: new Date().toISOString()
  },
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);
