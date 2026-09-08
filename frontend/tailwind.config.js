const path = require("path");
const dir = __dirname.replace(/\\/g, "/");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    dir + "/index.html",
    dir + "/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
