/**
 * Expo Config Plugin: Remove Unnecessary Android Permissions
 *
 * Third-party libraries (expo-audio, expo-image-picker, etc.) inject
 * permissions into the merged AndroidManifest that are broader than
 * what this travel booking app actually needs.
 *
 * This plugin removes the following permissions at build time:
 *
 * - SYSTEM_ALERT_WINDOW: allows drawing over other apps — not needed
 * - READ_EXTERNAL_STORAGE: legacy storage access (pre-Android 13) — replaced by READ_MEDIA_IMAGES
 * - WRITE_EXTERNAL_STORAGE: write access to shared storage — not needed
 * - MODIFY_AUDIO_SETTINGS: modifies global audio settings — not needed (only recording is used)
 *
 * Permissions intentionally KEPT:
 * - RECORD_AUDIO: required for voice search feature
 * - CAMERA: required for capturing payment receipts
 * - READ_MEDIA_IMAGES: modern photo picker (Android 13+)
 * - POST_NOTIFICATIONS: required for booking status push notifications
 * - INTERNET / ACCESS_NETWORK_STATE: required for all API calls
 * - FOREGROUND_SERVICE / FOREGROUND_SERVICE_MEDIA_PLAYBACK: injected by expo-audio, harmless
 */
const { withAndroidManifest } = require("@expo/config-plugins");

const PERMISSIONS_TO_REMOVE = [
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.MODIFY_AUDIO_SETTINGS",
];

module.exports = withAndroidManifest(async (config) => {
  const manifest = config.modResults;

  if (!manifest.manifest["uses-permission"]) {
    return config;
  }

  // Filter out unwanted permissions
  manifest.manifest["uses-permission"] = manifest.manifest[
    "uses-permission"
  ].filter((perm) => {
    const name = perm.$?.["android:name"] ?? "";
    const shouldRemove = PERMISSIONS_TO_REMOVE.includes(name);
    if (shouldRemove) {
      console.log(`[with-android-remove-permissions] Removed: ${name}`);
    }
    return !shouldRemove;
  });

  return config;
});
