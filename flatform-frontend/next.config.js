// next.config.js
const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");

// ⚠️ truyền đúng đường dẫn đến request.ts
const withNextIntl = createNextIntlPlugin(path.resolve("./i18n/request.ts"));

module.exports = withNextIntl({
  reactStrictMode: true,
});
