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
import { LoadingSpinner, PageLoader } from "@/components/LoadingSpinner"
import {
  listJobDescriptions,
  addJobDescription,
  updateJobDescription,
  deleteJobDescription,
} from "@/api/jobDescriptions"
import { analyzeJob } from "@/api/agent"
import type { JobDescription, JobAnalysis } from "@/types"
import { Plus, Pencil, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react"

const emptyForm = { title: "", company: "", description: "" }

export function JobDescriptionsPage() {
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobDescription | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<Record<string, JobAnalysis>>({})

  useEffect(() => {
    listJobDescriptions()
      .then((data) => {
        setJobs(data)
        data.forEach((j) => {
          if (j.analysis) setAnalyses((prev) => ({ ...prev, [j.id]: j.analysis! }))
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(job: JobDescription) {
    setEditing(job)
    setForm({ title: job.title, company: job.company, description: job.description })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const updated = await updateJobDescription(editing.id, form)
        setJobs((prev) => prev.map((j) => (j.id === editing.id ? updated : j)))
      } else {
        const created = await addJobDescription(form)
        setJobs((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job description?")) return
    try {
      await deleteJobDescription(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
    } catch {
      // ignore
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id)
    try {
      const result = await analyzeJob(id)
      setAnalyses((prev) => ({ ...prev, [id]: result }))
      setExpandedId(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setAnalyzingId(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Descriptions</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Job
        </Button>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">No job descriptions saved yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <CardDescription>{job.company}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyze(job.id)}
                    disabled={analyzingId === job.id}
                  >
                    {analyzingId === job.id ? (
                      <LoadingSpinner size="sm" className="mr-1" />
                    ) : (
                      <Sparkles className="mr-1 h-4 w-4" />
                    )}
                    Analyse
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(job)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                  >
                    {expandedId === job.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedId === job.id && (
              <CardContent className="flex flex-col gap-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {job.description}
                </p>

                {analyses[job.id] && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="mb-3 text-sm font-semibold">AI Analysis</p>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <span className="font-medium">Seniority:</span>{" "}
                        {analyses[job.id].seniorityLevel}
                      </div>
                      <div>
                        <span className="font-medium">Keywords:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {analyses[job.id].keywords.map((kw) => (
                            <Badge key={kw} variant="secondary">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Required Skills:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {analyses[job.id].requiredSkills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Job Description" : "Add Job Description"}</DialogTitle>
          </DialogHeader>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jd-title">Job Title</Label>
              <Input
                id="jd-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jd-company">Company</Label>
              <Input
                id="jd-company"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jd-description">Job Description</Label>
              <Textarea
                id="jd-description"
                rows={8}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Paste the full job description here…"
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
