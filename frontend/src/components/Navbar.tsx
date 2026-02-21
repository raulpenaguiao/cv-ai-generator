import { Link } from "@tanstack/react-router"
import { Moon, Sun, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import { useAuth } from "@/contexts/AuthContext"
import { logout } from "@/api/auth"

const navLinks = [
  { to: "/profile", label: "Profile" },
  { to: "/experiences", label: "Experiences" },
  { to: "/projects", label: "Projects" },
  { to: "/job-descriptions", label: "Jobs" },
  { to: "/generate", label: "Generate" },
  { to: "/compile", label: "Compile" },
  { to: "/settings", label: "Settings" },
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, logout: logoutCtx } = useAuth()

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore network errors on logout
    } finally {
      logoutCtx()
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground no-underline">
          <FileText className="h-5 w-5" />
          <span className="hidden sm:inline">CV AI Generator</span>
        </Link>

        {isAuthenticated && (
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap no-underline"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
