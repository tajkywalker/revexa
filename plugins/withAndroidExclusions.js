const { withAppBuildGradle, withProjectBuildGradle } = require("@expo/config-plugins");

const MARKER = "// Fix: exclude old com.android.support to avoid duplicate classes";

const appExclusionBlock = `
${MARKER}
configurations.all {
    exclude group: "com.android.support", module: "support-compat"
    exclude group: "com.android.support", module: "support-media-compat"
    exclude group: "com.android.support", module: "support-core-utils"
    exclude group: "com.android.support", module: "support-annotations"
    exclude group: "com.android.support", module: "support-fragment"
    exclude group: "com.android.support", module: "appcompat-v7"
    exclude group: "com.android.support", module: "support-v4"
    exclude group: "com.android.support", module: "support-core-ui"
    exclude group: "com.android.support", module: "animated-vector-drawable"
    exclude group: "com.android.support", module: "support-vector-drawable"
}
`;

const projectExclusionBlock = `
${MARKER}
subprojects {
    configurations.all {
        exclude group: "com.android.support", module: "support-compat"
        exclude group: "com.android.support", module: "support-media-compat"
        exclude group: "com.android.support", module: "support-core-utils"
        exclude group: "com.android.support", module: "support-annotations"
        exclude group: "com.android.support", module: "support-fragment"
        exclude group: "com.android.support", module: "appcompat-v7"
        exclude group: "com.android.support", module: "support-v4"
        exclude group: "com.android.support", module: "support-core-ui"
        exclude group: "com.android.support", module: "animated-vector-drawable"
        exclude group: "com.android.support", module: "support-vector-drawable"
    }
}
`;

module.exports = function withAndroidExclusions(config) {
  // Apply to android/app/build.gradle (direct fix for :app:checkReleaseDuplicateClasses)
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += appExclusionBlock;
    }
    return config;
  });

  // Apply to android/build.gradle as well (subprojects broadcover)
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += projectExclusionBlock;
    }
    return config;
  });

  return config;
};
