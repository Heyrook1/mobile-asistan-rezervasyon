const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force Metro to use the Node watcher instead of Watchman
// (Watchman fails in sandboxed CI environments)
config.watcher.useWatchman = false;
config.watcher.healthCheck = { enabled: false };
config.watcher.watchman = { deferStates: false };

config.resolver = {
  ...config.resolver,
  platforms: ["web", "ios", "android", "native"],
};

module.exports = config;
