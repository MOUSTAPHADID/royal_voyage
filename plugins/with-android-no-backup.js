/**
 * Expo Config Plugin: Disable Android Backup
 *
 * Sets android:allowBackup="false" and android:fullBackupContent="false"
 * by directly modifying the generated AndroidManifest.xml file.
 *
 * Uses withFinalizedMod to ensure this runs AFTER all other plugins
 * (including expo-audio, expo-image-picker, etc.) have finished writing
 * to the AndroidManifest.
 *
 * Security rationale: The app handles PII (passport numbers, payment
 * details, booking references) that must not leave the device via
 * automatic backup channels.
 */
const { withMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

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

      // Set allowBackup=false
      content = content.replace(
        /android:allowBackup="true"/g,
        'android:allowBackup="false"'
      );

      // Add fullBackupContent=false if not already present
      if (!content.includes("android:fullBackupContent")) {
        content = content.replace(
          /android:allowBackup="false"/,
          'android:allowBackup="false" android:fullBackupContent="false"'
        );
      }

      fs.writeFileSync(manifestPath, content, "utf8");
      console.log("[with-android-no-backup] Set allowBackup=false ✓");

      return config;
    },
  });
