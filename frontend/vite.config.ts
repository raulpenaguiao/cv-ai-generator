import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/cv-ai-generator/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
