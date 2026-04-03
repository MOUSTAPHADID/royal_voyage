/**
 * Expo Config Plugin: Remove Unnecessary Android Permissions
 *
 * Removes unwanted permissions injected by third-party libraries by
 * directly modifying the generated AndroidManifest.xml file.
 *
 * Uses withFinalizedMod to ensure this runs AFTER all other plugins
 * (including expo-audio, expo-image-picker, etc.) have finished injecting
 * their permissions into the AndroidManifest.
 *
 * Permissions removed:
 * - SYSTEM_ALERT_WINDOW: allows drawing over other apps — not needed
 * - READ_EXTERNAL_STORAGE: legacy storage access — replaced by READ_MEDIA_IMAGES
 * - WRITE_EXTERNAL_STORAGE: write access to shared storage — not needed
 * - MODIFY_AUDIO_SETTINGS: modifies global audio settings — not needed
 */
const { withMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PERMISSIONS_TO_REMOVE = [
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.MODIFY_AUDIO_SETTINGS",
];

module.exports = (config) =>
  withMod(config, {
    platform: "android",
    mod: "finalized",
    action: async (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
      );

      if (!fs.existsSync(manifestPath)) return config;

      let content = fs.readFileSync(manifestPath, "utf8");

      for (const permission of PERMISSIONS_TO_REMOVE) {
        const escaped = permission.replace(/\./g, "\\.");
        const regex = new RegExp(
          `[ \\t]*<uses-permission[^>]*android:name="${escaped}"[^/]*/?>\\n?`,
          "g"
        );
        if (regex.test(content)) {
          content = content.replace(
            new RegExp(
              `[ \\t]*<uses-permission[^>]*android:name="${escaped}"[^/]*/?>\\n?`,
              "g"
            ),
            ""
          );
          console.log(`[with-android-remove-permissions] Removed: ${permission}`);
        }
      }

      fs.writeFileSync(manifestPath, content, "utf8");

      return config;
    },
  });
