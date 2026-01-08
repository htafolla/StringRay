module.exports = {
  urls: [
    "http://localhost:3000/",
    "http://localhost:3000/api/health",
    "http://localhost:3000/api/orchestrate",
  ],
  defaults: {
    timeout: 10000,
    viewport: {
      width: 1280,
      height: 720,
    },
  },
  runners: ["axe", "htmlcs"],
};
