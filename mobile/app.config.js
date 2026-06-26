const appJson = require("./app.json");

const releaseType = process.env.TRADIA_ANDROID_RELEASE_TYPE || "development";
const releaseArtifact = process.env.TRADIA_ANDROID_ARTIFACT || "development";
const releaseProfile = process.env.TRADIA_EAS_PROFILE || process.env.EAS_BUILD_PROFILE || "local";

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...config.extra,
    ...appJson.expo.extra,
    release: {
      type: releaseType,
      artifact: releaseArtifact,
      profile: releaseProfile,
      startedAt: process.env.TRADIA_RELEASE_STARTED_AT || null
    }
  }
});
