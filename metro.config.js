const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add PDF and binary asset support
config.resolver = config.resolver || {};
config.resolver.assetExts = config.resolver.assetExts || [];
if (!config.resolver.assetExts.includes("pdf")) {
  config.resolver.assetExts.push("pdf");
}

// Web mocks for native-only modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock react-native-maps on web (not supported)
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      filePath: path.resolve(__dirname, "mocks/react-native-maps.js"),
      type: "sourceFile",
    };
  }
  
  // Mock @stripe/stripe-react-native on web (not supported)
  if (platform === "web" && moduleName === "@stripe/stripe-react-native") {
    return {
      filePath: path.resolve(__dirname, "mocks/stripe-react-native.js"),
      type: "sourceFile",
    };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
