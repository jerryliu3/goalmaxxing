const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);
// Shared hooks must use the native renderer's React, even when web uses a newer version.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (["react", "react/jsx-runtime", "react/jsx-dev-runtime"].includes(moduleName)) {
    return { type: "sourceFile", filePath: require.resolve(moduleName, { paths: [__dirname] }) };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
