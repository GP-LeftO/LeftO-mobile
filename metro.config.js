const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Redirect native-only modules to web-compatible shims when bundling for web
const WEB_MOCKS = {
  "react-native-maps": path.resolve(__dirname, "src/mocks/react-native-maps.ts"),
  "@react-native-voice/voice": path.resolve(__dirname, "src/mocks/react-native-voice.ts"),
  "react-native-webview": path.resolve(__dirname, "src/mocks/react-native-webview.tsx"),
  "@stripe/stripe-react-native": path.resolve(__dirname, "src/mocks/stripe-react-native.ts"),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_MOCKS[moduleName]) {
    return { filePath: WEB_MOCKS[moduleName], type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;