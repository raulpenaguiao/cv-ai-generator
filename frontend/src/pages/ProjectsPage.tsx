import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { PageLoader } from "@/components/LoadingSpinner"
import { listProjects, addProject, updateProject, deleteProject } from "@/api/projects"
import type { Project } from "@/types"
import { Plus, Pencil, Trash2 } from "lucide-react"

const emptyForm: Omit<Project, "id"> = { title: "", description: "", keywords: [] }

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [keywordsInput, setKeywordsInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setBackendDown(true))
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setKeywordsInput("")
    setDialogOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setForm({ title: project.title, description: project.description, keywords: project.keywords })
    setKeywordsInput(project.keywords.join(", "))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const data = {
      ...form,
      keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
    }
    try {
      if (editing) {
        const updated = await updateProject(editing.id, data)
        setProjects((prev) => prev.map((p) => (p.id === editing.id ? updated : p)))
      } else {
        const created = await addProject(data)
        setProjects((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // ignore
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button size="sm" onClick={openAdd} disabled={backendDown}>
          <Plus className="mr-1 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to manage projects.
        </div>
      )}

      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects yet. Add your first one!</p>
      )}

      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  {project.description && (
                    <CardDescription className="mt-1">{project.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {project.keywords.length > 0 && (
              <CardContent className="flex flex-wrap gap-1">
                {project.keywords.map((kw) => (
                  <Badge key={kw} variant="secondary">
                    {kw}
                  </Badge>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="React, AI, TypeScript"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
