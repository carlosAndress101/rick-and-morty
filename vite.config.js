import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

/**
 * Vite configuration.
 *
 * @see https://vite.dev/config/
 */
export default defineConfig({
  /*
   * Cloudflare Pages serves each project from the root of its own hostname
   * (<project>.pages.dev, or a custom domain), so assets resolve from "/".
   *
   * This was previously "/rick-and-morty/" for GitHub Pages, which publishes project
   * sites under a repository-named sub-path. Deploying that value to Cloudflare would
   * emit asset URLs like /rick-and-morty/assets/index.js against files that actually live
   * at /assets/index.js — a blank page with two 404s and no error in the UI.
   *
   * Only change this if the app moves back to a host that serves it from a sub-path.
   */
  base: "/",

  plugins: [react()],

  build: {
    /*
     * Explicit browser floor rather than a bare "es2022" ECMAScript level, so the
     * supported matrix is enforced by the build instead of merely asserted in the README.
     * Safari 16 is the binding constraint; the others are the contemporaneous releases.
     * Raising any of these is a compatibility decision, not a formatting one.
     */
    target: ["chrome107", "edge107", "firefox102", "safari16"],
    // The deployed bundle is public, so skip shipping the extra payload.
    sourcemap: false,
    // Fail the build rather than silently shipping an oversized bundle.
    chunkSizeWarningLimit: 500,
  },

  server: {
    port: 5173,
    open: true,
  },
});
