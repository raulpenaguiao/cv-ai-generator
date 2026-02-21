import { Link } from "@tanstack/react-router"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import {
  User,
  Briefcase,
  FolderOpen,
  FileSearch,
  Wand2,
  Download,
  Settings,
} from "lucide-react"

const sections = [
  {
    to: "/profile",
    icon: User,
    title: "Profile",
    description: "Manage your personal information and photo.",
  },
  {
    to: "/experiences",
    icon: Briefcase,
    title: "Experiences",
    description: "Add work, education, and hobby experiences.",
  },
  {
    to: "/projects",
    icon: FolderOpen,
    title: "Projects",
    description: "Showcase your personal and professional projects.",
  },
  {
    to: "/job-descriptions",
    icon: FileSearch,
    title: "Job Descriptions",
    description: "Save and analyse target job listings.",
  },
  {
    to: "/generate",
    icon: Wand2,
    title: "Generate",
    description: "Use AI to generate and refine CV blurbs.",
  },
  {
    to: "/compile",
    icon: Download,
    title: "Compile CV",
    description: "Compile your tailored CV and download as PDF.",
  },
  {
    to: "/settings",
    icon: Settings,
    title: "Settings",
    description: "Manage your OpenAI API key.",
  },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">CV AI Generator</h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Build tailored, professional CVs with AI assistance. Manage your profile, paste a job
          description, generate AI-written blurbs, and compile a polished PDF in minutes.
        </p>

        {!isAuthenticated && (
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ to, icon: Icon, title, description }) => (
            <Link key={to} to={to} className="no-underline">
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="h-full opacity-60">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
