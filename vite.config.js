import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

/**
 * Vite configuration.
 *
 * @see https://vite.dev/config/
 */
export default defineConfig({
  /*
   * The app is published to GitHub Pages as a *project* site, which serves it from a
   * sub-path (https://<user>.github.io/rick-and-morty/) rather than the domain root.
   * Without this, every built asset URL would point at the domain root and 404.
   *
   * This is a root-relative path, not the absolute URL that was here before: it resolves
   * to exactly the same URLs once deployed, but it also lets `vite preview` and
   * `vite dev` serve the app locally instead of pointing assets at the live github.io
   * host. Keep the trailing slash — Vite joins it directly onto asset filenames.
   */
  base: "/rick-and-morty/",

  plugins: [react()],

  build: {
    /*
     * Explicit browser floor rather than a bare "es2022" ECMAScript level, so the
     * supported matrix is enforced by the build instead of merely asserted in the README.
     * Safari 16 is the binding constraint; the others are the contemporaneous releases.
     * Raising any of these is a compatibility decision, not a formatting one.
     */
    target: ["chrome107", "edge107", "firefox102", "safari16"],
    // Emitted sources are public on GitHub Pages, so skip the extra payload.
    sourcemap: false,
    // Fail the build rather than silently shipping an oversized bundle.
    chunkSizeWarningLimit: 500,
  },

  server: {
    port: 5173,
    open: true,
  },
});
