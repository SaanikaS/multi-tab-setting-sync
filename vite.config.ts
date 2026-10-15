import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths let the same build work on GitHub Pages sub-paths
  // (https://<user>.github.io/<repo>/) and on any other host.
  base: "./",
});
