const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const pdfjsDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
);

// Create public directory if it doesn't exist
fs.mkdirSync(publicDir, { recursive: true });

// Copy PDF.js files
fs.copyFileSync(
  path.join(pdfjsDir, "pdf.min.mjs"),
  path.join(publicDir, "pdf.min.mjs"),
);

fs.copyFileSync(
  path.join(pdfjsDir, "pdf.worker.min.mjs"),
  path.join(publicDir, "pdf.worker.min.mjs"),
);

console.log("✓ PDF.js files copied successfully");
