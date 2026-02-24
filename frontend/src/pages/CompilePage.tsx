import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { listExperiences } from "@/api/experiences"
import { listProjects } from "@/api/projects"
import { listBlurbs } from "@/api/blurbs"
import { compileCV } from "@/api/latex"
import type { Experience, Project, Blurb } from "@/types"
import { Download, FileText } from "lucide-react"

const FONT_SIZES = [10, 11, 12]
const TEMPLATES = [{ value: "modern-1", label: "Modern (default)" }]

export function CompilePage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [blurbs, setBlurbs] = useState<Blurb[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("modern-1")
  const [fontSize, setFontSize] = useState(11)
  const [selectedExpIds, setSelectedExpIds] = useState<Set<string>>(new Set())
  const [selectedProjIds, setSelectedProjIds] = useState<Set<string>>(new Set())
  const [selectedBlurbIds, setSelectedBlurbIds] = useState<Set<string>>(new Set())
  const [compiling, setCompiling] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    Promise.all([listExperiences(), listProjects(), listBlurbs()])
      .then(([exps, projs, blrbs]) => {
        setExperiences(exps)
        setProjects(projs)
        setBlurbs(blrbs)
        // Select all by default
        setSelectedExpIds(new Set(exps.map((e) => e.id)))
        setSelectedProjIds(new Set(projs.map((p) => p.id)))
        setSelectedBlurbIds(new Set(blrbs.map((b) => b.id)))
      })
      .catch(() => setBackendDown(true))
  }, [])

  function toggleId(set: Set<string>, id: string): Set<string> {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  async function handleCompile() {
    setCompiling(true)
    setError(null)
    setPdfUrl(null)
    try {
      const res = await compileCV({
        template: selectedTemplate,
        fontSize,
        blurbIds: [...selectedBlurbIds],
        experienceIds: [...selectedExpIds],
        projectIds: [...selectedProjIds],
      })
      setPdfUrl(res.pdfUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed")
    } finally {
      setCompiling(false)
    }
  }

  const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Compile CV</h1>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to compile your CV.
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-col gap-6">
        {/* Template & font */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Font Size</Label>
              <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}pt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Blurbs */}
        {blurbs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Blurbs to include</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {blurbs.map((b) => (
                <label key={b.id} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBlurbIds.has(b.id)}
                    onChange={() => setSelectedBlurbIds(toggleId(selectedBlurbIds, b.id))}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <span className="font-medium capitalize">{b.type}:</span>{" "}
                    <span className="text-muted-foreground line-clamp-1">{b.content}</span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Experiences */}
        {experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Experiences to include</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {experiences.map((exp) => (
                <label key={exp.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedExpIds.has(exp.id)}
                    onChange={() => setSelectedExpIds(toggleId(selectedExpIds, exp.id))}
                  />
                  <span className="text-sm">
                    <span className="font-medium">{exp.title}</span>{" "}
                    <span className="text-muted-foreground">
                      · {exp.organization} · {exp.category}
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects to include</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {projects.map((proj) => (
                <label key={proj.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedProjIds.has(proj.id)}
                    onChange={() => setSelectedProjIds(toggleId(selectedProjIds, proj.id))}
                  />
                  <span className="text-sm font-medium">{proj.title}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Compile button */}
        <Button onClick={handleCompile} disabled={compiling || backendDown} size="lg" className="w-full sm:w-auto">
          {compiling ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Compiling…
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Compile CV
            </>
          )}
        </Button>

        {/* Download links */}
        {pdfUrl && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="font-medium text-green-700 dark:text-green-400">CV compiled successfully!</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={`${BASE_URL}${pdfUrl}`} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
