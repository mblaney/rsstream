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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@mblaney/")) return "holster"
          if (
            id.includes("@mui/") ||
            id.includes("@emotion/") ||
            id.includes("/node_modules/react") ||
            id.includes("/node_modules/react-dom") ||
            id.includes("/node_modules/react-router")
          )
            return "vendor"
        },
      },
    },
  },
})
