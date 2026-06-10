import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"
import {VitePWA} from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.js",
      manifest: false,
      injectRegister: null,
    }),
  ],
  build: {
    outDir: "build",
  },
})
