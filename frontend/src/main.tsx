import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AuthProvider } from "@/contexts/AuthContext"
import { router } from "@/router"
import "@/index.css"

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

createRoot(root).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
