const {
  withAppBuildGradle,
  withProjectBuildGradle,
  withGradleProperties,
} = require("@expo/config-plugins");

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
allprojects {
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
  // 1. Add exclusions to android/app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += appExclusionBlock;
    }
    return config;
  });

  // 2. Add exclusions via allprojects{} in android/build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += projectExclusionBlock;
    }
    return config;
  });

  // 3. Enable Jetifier directly in gradle.properties (backup fix)
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !["android.enableJetifier", "android.useAndroidX"].includes(item.key)
    );
    config.modResults.push(
      { type: "property", key: "android.useAndroidX", value: "true" },
      { type: "property", key: "android.enableJetifier", value: "true" }
    );
    return config;
  });

  return config;
};
