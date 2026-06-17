#!/bin/bash
# Fix duplicate class conflict between androidx and old com.android.support
GRADLE_FILE="android/build.gradle"

if [ -f "$GRADLE_FILE" ]; then
  cat >> "$GRADLE_FILE" << 'EOF'

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
EOF
  echo "Fixed duplicate class conflict in build.gradle"
fi
