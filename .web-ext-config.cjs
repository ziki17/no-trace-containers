module.exports = {
  ignoreFiles: [
    "package-lock.json",
    "package.json",
    "node_modules",
    ".web-ext-config.js",
    "dist",
    "README.md",
    "journal-*.md",
    ".gitignore",
    ".github",
  ],
  build: {
    overwriteDest: true,
  },
};
