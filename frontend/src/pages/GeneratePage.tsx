import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { listJobDescriptions } from "@/api/jobDescriptions"
import { generateBlurb } from "@/api/agent"
import { listBlurbs, saveBlurb } from "@/api/blurbs"
import { compileCV } from "@/api/latex"
import { listExperiences } from "@/api/experiences"
import { listProjects } from "@/api/projects"
import type { JobDescription, BlurbType, BlurbMode, Blurb } from "@/types"
import { Wand2, Download, FolderOpen, Save } from "lucide-react"

const BLURB_TYPES: { type: BlurbType; label: string }[] = [
  { type: "summary", label: "Summary" },
  { type: "skills", label: "Skills" },
  { type: "motivation", label: "Motivation" },
  { type: "closing", label: "Closing" },
]

const MODES: { mode: BlurbMode; label: string }[] = [
  { mode: "full", label: "Generate from scratch" },
  { mode: "modify", label: "Rephrase" },
  { mode: "double-check", label: "Check grammar" },
]

type BlurbsState = Record<BlurbType, string>
type ModesState = Record<BlurbType, BlurbMode>
type GeneratingState = Record<BlurbType, boolean>
type SavedState = Record<BlurbType, boolean>

const initBlurbs: BlurbsState = { summary: "", skills: "", motivation: "", closing: "" }
const initModes: ModesState = { summary: "full", skills: "full", motivation: "full", closing: "full" }
const initGenerating: GeneratingState = { summary: false, skills: false, motivation: false, closing: false }
const initSaved: SavedState = { summary: false, skills: false, motivation: false, closing: false }

const CARD_H = "h-[190px]"

export function GeneratePage() {
  const [blurbs, setBlurbs] = useState<BlurbsState>(initBlurbs)
  const [modes, setModes] = useState<ModesState>(initModes)
  const [generating, setGenerating] = useState<GeneratingState>(initGenerating)
  const [savedMap, setSavedMap] = useState<SavedState>(initSaved)
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [loadDialogType, setLoadDialogType] = useState<BlurbType | null>(null)
  const [dialogBlurbs, setDialogBlurbs] = useState<Blurb[]>([])
  const [loadingDialog, setLoadingDialog] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [backendDown, setBackendDown] = useState(false)

  const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

  useEffect(() => {
    listJobDescriptions()
      .then(setJobs)
      .catch(() => setBackendDown(true))
  }, [])

  const isAnyGenerating = Object.values(generating).some(Boolean) || generatingAll

  async function handleGenerateSingle(type: BlurbType) {
    setGenerating((prev) => ({ ...prev, [type]: true }))
    setError(null)
    try {
      const res = await generateBlurb({
        type,
        mode: modes[type],
        previousBlurb: blurbs[type] || undefined,
        jobDescriptionId: selectedJobId || undefined,
      })
      setBlurbs((prev) => ({ ...prev, [type]: res.generatedBlurb }))
      setSavedMap((prev) => ({ ...prev, [type]: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGenerating((prev) => ({ ...prev, [type]: false }))
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true)
    setError(null)
    const results = await Promise.allSettled(
      BLURB_TYPES.map(({ type }) =>
        generateBlurb({
          type,
          mode: modes[type],
          previousBlurb: blurbs[type] || undefined,
          jobDescriptionId: selectedJobId || undefined,
        }).then((res) => ({ type, text: res.generatedBlurb }))
      )
    )
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        setBlurbs((prev) => ({ ...prev, [r.value.type]: r.value.text }))
        setSavedMap((prev) => ({ ...prev, [r.value.type]: false }))
      }
    })
    const failed = results.filter((r) => r.status === "rejected")
    if (failed.length > 0) setError("Some blurbs failed to generate.")
    setGeneratingAll(false)
  }

  async function handleOpenLoadDialog(type: BlurbType) {
    setLoadDialogType(type)
    setLoadingDialog(true)
    try {
      const all = await listBlurbs()
      setDialogBlurbs(all.filter((b) => b.type === type))
    } catch {
      setDialogBlurbs([])
    } finally {
      setLoadingDialog(false)
    }
  }

  function handleSelectBlurb(content: string) {
    if (loadDialogType) {
      setBlurbs((prev) => ({ ...prev, [loadDialogType]: content }))
      setSavedMap((prev) => ({ ...prev, [loadDialogType]: false }))
    }
    setLoadDialogType(null)
  }

  async function handleSave(type: BlurbType) {
    if (!blurbs[type]) return
    try {
      await saveBlurb({
        type,
        content: blurbs[type],
        jobDescriptionId: selectedJobId || undefined,
      })
      setSavedMap((prev) => ({ ...prev, [type]: true }))
      setTimeout(() => setSavedMap((prev) => ({ ...prev, [type]: false })), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    }
  }

  async function handleCompile() {
    setCompiling(true)
    setError(null)
    setPdfUrl(null)
    try {
      const [experiences, projects, savedBlurbs] = await Promise.all([
        listExperiences(),
        listProjects(),
        listBlurbs(),
      ])
      const res = await compileCV({
        template: "modern-1",
        fontSize: 11,
        blurbIds: savedBlurbs.map((b) => b.id),
        experienceIds: experiences.map((e) => e.id),
        projectIds: projects.map((p) => p.id),
      })
      setPdfUrl(res.pdfUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed")
    } finally {
      setCompiling(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Generate CV Blurbs</h1>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to use AI generation and PDF compilation. You can still write and edit blurbs manually.
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">

        {/* Column 1 — options & mode per blurb */}
        <div className="flex flex-col gap-4 w-48 shrink-0">
          <div className={`${CARD_H} invisible`} aria-hidden /> {/* spacer for job selector row */}
          {BLURB_TYPES.map(({ type, label }) => (
            <Card key={type} className={CARD_H}>
              <CardContent className="p-4 h-full flex flex-col gap-3">
                <p className="text-sm font-semibold">{label}</p>
                <div className="flex flex-col gap-1 flex-1">
                  {MODES.map(({ mode, label: modeLabel }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setModes((prev) => ({ ...prev, [type]: mode }))}
                      className={`text-xs text-left px-2 py-1.5 rounded transition-colors ${
                        modes[type] === mode
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {modeLabel}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs w-full"
                  disabled={generating[type] || isAnyGenerating || backendDown}
                  onClick={() => handleGenerateSingle(type)}
                >
                  {generating[type] ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1" />
                  )}
                  Generate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 2 — textarea + load/save per blurb */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Job selector */}
          <div className={`${CARD_H} flex items-center gap-3 px-1`}>
            <Label className="shrink-0 text-sm">Target job:</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a job description (optional)…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} — {job.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {BLURB_TYPES.map(({ type, label }) => (
            <Card key={type} className={CARD_H}>
              <CardContent className="p-3 h-full flex flex-col gap-2">
                <Textarea
                  className="flex-1 resize-none text-sm"
                  placeholder={`${label} will appear here…`}
                  value={blurbs[type]}
                  onChange={(e) => {
                    setBlurbs((prev) => ({ ...prev, [type]: e.target.value }))
                    setSavedMap((prev) => ({ ...prev, [type]: false }))
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleOpenLoadDialog(type)}
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Load saved
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${savedMap[type] ? "text-green-600" : ""}`}
                    disabled={!blurbs[type]}
                    onClick={() => handleSave(type)}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {savedMap[type] ? "Saved!" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 3 — shared action panel (sticky) */}
        <div className="sticky top-4 w-64 shrink-0 flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col gap-3">
              <Button
                className="w-full"
                disabled={isAnyGenerating || backendDown}
                onClick={handleGenerateAll}
              >
                {generatingAll ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate all
                  </>
                )}
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                disabled={compiling || backendDown}
                onClick={handleCompile}
              >
                {compiling ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Compiling…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Compile & download
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {pdfUrl && (
            <Card>
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  CV compiled!
                </p>
                <a href={`${BASE_URL}${pdfUrl}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
                <iframe
                  src={`${BASE_URL}${pdfUrl}`}
                  title="Compiled CV preview"
                  className="w-full rounded border"
                  style={{ height: 480 }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Load saved blurbs dialog */}
      <Dialog open={loadDialogType !== null} onOpenChange={() => setLoadDialogType(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Load saved {loadDialogType} blurb
            </DialogTitle>
          </DialogHeader>

          {loadingDialog ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : dialogBlurbs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No saved blurbs for this type yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {dialogBlurbs.map((blurb) => (
                <button
                  key={blurb.id}
                  type="button"
                  className="text-left rounded-lg border p-3 hover:bg-muted transition-colors"
                  onClick={() => handleSelectBlurb(blurb.content)}
                >
                  <p className="text-sm line-clamp-3">{blurb.content}</p>
                  {blurb.jobDescriptionId && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      linked to job
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
