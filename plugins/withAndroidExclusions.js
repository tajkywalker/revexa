const { withProjectBuildGradle } = require("@expo/config-plugins");

const MARKER = "// Fix: exclude old com.android.support to avoid duplicate classes";

const exclusionBlock = `
${MARKER}
subprojects {
  configurations.all {
    exclude group: "com.android.support", module: "support-compat"
    exclude group: "com.android.support", module: "support-media-compat"
    exclude group: "com.android.support", module: "support-core-utils"
    exclude group: "com.android.support", module: "support-annotations"
    exclude group: "com.android.support", module: "support-fragment"
    exclude group: "com.android.support", module: "appcompat-v7"
  }
}
`;

module.exports = function withAndroidExclusions(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += exclusionBlock;
    }
    return config;
  });
};
