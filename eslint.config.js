// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "dist-preview/*", "preview/*"],
  },
  {
    // React Native bundles fonts, images and data files with require().
    rules: { "@typescript-eslint/no-require-imports": "off" },
  }
]);
