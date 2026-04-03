import type { ExpoConfig } from "expo/config";

// ─── Production Bundle Configuration ─────────────────────────────────────────
// Final production package name and scheme for Royal Voyage
const bundleId = "com.royalvoyage.app";
const appScheme = "royalvoyage";

const env = {
  // App branding
  appName: "Royal Voyage",
  appSlug: "royal_voyage",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663457917822/dCSeDyLMxwR8uDkjtk8yd3/icon_37ebad54.png",
  scheme: appScheme,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.1.23",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // Microphone usage description (required for voice search feature)
      NSMicrophoneUsageDescription:
        "Royal Voyage uses the microphone for voice search only. No audio is stored or transmitted.",
      // Photo library usage (required for uploading payment receipts and partner logos)
      NSPhotoLibraryUsageDescription:
        "Royal Voyage needs access to your photo library to upload payment receipts and partner logos.",
      NSCameraUsageDescription:
        "Royal Voyage needs camera access to capture payment receipts.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    // ─── Minimum required permissions ────────────────────────────────────────
    // RECORD_AUDIO: required for voice search (expo-audio)
    // CAMERA: required for capturing payment receipts (expo-image-picker)
    // READ_MEDIA_IMAGES: modern replacement for READ_EXTERNAL_STORAGE (Android 13+)
    // POST_NOTIFICATIONS: required for booking status push notifications
    // INTERNET & ACCESS_NETWORK_STATE: required for all API calls
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
      "android.permission.READ_MEDIA_IMAGES",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    // ─── Security hardening ───────────────────────────────────────────────────
    // allowBackup=false: prevents backup of sensitive booking/payment data
    // This is set via the withAndroidManifest plugin below
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID for admin access.",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone for voice search.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-notifications",
      {
        sounds: ["./assets/sounds/new_booking.wav"],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    // ─── Security: disable Android backup ────────────────────────────────────
    // Prevents sensitive user/booking/payment data from being backed up
    // to Google Drive or transferred via adb backup
    "./plugins/with-android-no-backup.js",
    // ─── Security: remove unnecessary permissions ─────────────────────────────
    // Removes SYSTEM_ALERT_WINDOW, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
    // that may be injected by third-party libraries
    "./plugins/with-android-remove-permissions.js",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
