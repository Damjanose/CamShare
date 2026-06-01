import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("/react/") || id.includes("/react-dom/")) return "vendor-react"
          if (id.includes("/react-router") || id.includes("/react-router-dom/")) return "vendor-router"
          if (id.includes("/@tanstack/")) return "vendor-query"
          if (id.includes("/socket.io-client/") || id.includes("/engine.io-client/")) return "vendor-socket"
          if (id.includes("/zustand/") || id.includes("/clsx/") || id.includes("/tailwind-merge/")) return "vendor-misc"
        },
      },
    },
  },
})
