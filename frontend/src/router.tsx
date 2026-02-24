import { createRouter, createRoute, createRootRoute, Outlet, redirect } from "@tanstack/react-router"
import { Navbar } from "@/components/Navbar"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { ExperiencesPage } from "@/pages/ExperiencesPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { JobDescriptionsPage } from "@/pages/JobDescriptionsPage"
import { BlurbsPage } from "@/pages/BlurbsPage"
import { GeneratePage } from "@/pages/GeneratePage"
import { SettingsPage } from "@/pages/SettingsPage"

function requireAuth() {
  const token = localStorage.getItem("cv_token")
  if (!token) {
    throw redirect({ to: "/login" })
  }
}

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
    </div>
  ),
})

// Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
})

// Protected routes
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: ProfilePage,
})

const experiencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/experiences",
  beforeLoad: requireAuth,
  component: ExperiencesPage,
})

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  beforeLoad: requireAuth,
  component: ProjectsPage,
})

const jobDescriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/job-descriptions",
  beforeLoad: requireAuth,
  component: JobDescriptionsPage,
})

const blurbsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blurbs",
  beforeLoad: requireAuth,
  component: BlurbsPage,
})

const generateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generate",
  beforeLoad: requireAuth,
  component: GeneratePage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  beforeLoad: requireAuth,
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  experiencesRoute,
  projectsRoute,
  jobDescriptionsRoute,
  blurbsRoute,
  generateRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
  basepath: "/cv-ai-generator",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
