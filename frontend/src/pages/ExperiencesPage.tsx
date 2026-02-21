import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { listExperiences, addExperience, updateExperience, deleteExperience } from "@/api/experiences"
import type { Experience, ExperienceCategory } from "@/types"
import { Plus, Pencil, Trash2 } from "lucide-react"

const CATEGORIES: { value: ExperienceCategory; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "education", label: "Education" },
  { value: "hobby", label: "Hobby" },
]

const emptyForm: Omit<Experience, "id"> = {
  category: "work",
  title: "",
  organization: "",
  startDate: "",
  endDate: null,
  description: "",
  keywords: [],
}

export function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [keywordsInput, setKeywordsInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listExperiences()
      .then(setExperiences)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openAdd(category: ExperienceCategory) {
    setEditing(null)
    setForm({ ...emptyForm, category })
    setKeywordsInput("")
    setDialogOpen(true)
  }

  function openEdit(exp: Experience) {
    setEditing(exp)
    setForm({ ...exp })
    setKeywordsInput(exp.keywords.join(", "))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const data = { ...form, keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean) }
    try {
      if (editing) {
        const updated = await updateExperience(editing.id, data)
        setExperiences((prev) => prev.map((e) => (e.id === editing.id ? updated : e)))
      } else {
        const created = await addExperience(data)
        setExperiences((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this experience?")) return
    try {
      await deleteExperience(id)
      setExperiences((prev) => prev.filter((e) => e.id !== id))
    } catch {
      // ignore
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Experiences</h1>

      <Tabs defaultValue="work">
        <TabsList className="mb-4">
          {CATEGORIES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(({ value, label }) => {
          const filtered = experiences.filter((e) => e.category === value)
          return (
            <TabsContent key={value} value={value}>
              <div className="mb-4 flex justify-end">
                <Button size="sm" onClick={() => openAdd(value)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add {label}
                </Button>
              </div>

              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">No {label.toLowerCase()} entries yet.</p>
              )}

              <div className="flex flex-col gap-4">
                {filtered.map((exp) => (
                  <Card key={exp.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{exp.title}</CardTitle>
                          <CardDescription>
                            {exp.organization} · {exp.startDate} – {exp.endDate ?? "Present"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(exp)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(exp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {(exp.description || exp.keywords.length > 0) && (
                      <CardContent className="flex flex-col gap-2">
                        {exp.description && (
                          <p className="text-sm text-muted-foreground">{exp.description}</p>
                        )}
                        {exp.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {exp.keywords.map((kw) => (
                              <Badge key={kw} variant="secondary">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Experience" : "Add Experience"}</DialogTitle>
          </DialogHeader>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <div className="flex gap-2">
                {CATEGORIES.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={form.category === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm((p) => ({ ...p, category: value }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {(["title", "organization"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <Label htmlFor={field}>{field === "title" ? "Title" : "Organisation"}</Label>
                <Input
                  id={field}
                  value={form[field]}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate">End Date (blank = present)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value || null }))
                  }
                />
              </div>
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
                placeholder="React, TypeScript, AWS"
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
