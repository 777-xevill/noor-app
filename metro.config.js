// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Large reference data (Quran text, duas) ships as assets and loads on demand,
// instead of being parsed into the JavaScript bundle at startup.
config.resolver.assetExts.push('qdata');

module.exports = config;
