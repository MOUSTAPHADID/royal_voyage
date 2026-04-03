/**
 * Expo Config Plugin: Disable Android Backup
 *
 * Sets android:allowBackup="false" and android:fullBackupContent="false"
 * on the <application> element to prevent sensitive user, booking, and
 * payment data from being backed up to Google Drive or transferred via
 * adb backup.
 *
 * Security rationale: The app handles PII (passport numbers, payment
 * details, booking references) that must not leave the device via
 * automatic backup channels.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = withAndroidManifest(async (config) => {
  const manifest = config.modResults;
  const application = manifest.manifest.application?.[0];

  if (application) {
    // Disable all forms of Android backup
    application.$["android:allowBackup"] = "false";
    // Suppress the fullBackupContent warning that appears when allowBackup=false
    application.$["android:fullBackupContent"] = "false";
    // Prevent data extraction via USB debugging
    application.$["android:allowClearUserData"] = "true";
  }

  return config;
});
