import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { listJobDescriptions } from "@/api/jobDescriptions"
import { generateBlurb } from "@/api/agent"
import { saveBlurb } from "@/api/blurbs"
import type { JobDescription, BlurbType, BlurbMode } from "@/types"
import { Wand2, RefreshCw, SpellCheck, Save } from "lucide-react"

const BLURB_TYPES: { type: BlurbType; label: string; description: string }[] = [
  {
    type: "summary",
    label: "Summary",
    description: "A 2–3 sentence professional summary tailored to the role.",
  },
  {
    type: "skills",
    label: "Skills",
    description: "Key technical and soft skills relevant to the position.",
  },
  {
    type: "motivation",
    label: "Motivation",
    description: "Why you want this specific role at this company.",
  },
  {
    type: "closing",
    label: "Closing Statement",
    description: "A confident closing sentence for your CV.",
  },
]

type BlurbsState = Record<BlurbType, string>
type LoadingState = Record<BlurbType, BlurbMode | null>
type SavedState = Record<BlurbType, boolean>

const initBlurbs: BlurbsState = { summary: "", skills: "", motivation: "", closing: "" }
const initLoading: LoadingState = { summary: null, skills: null, motivation: null, closing: null }
const initSaved: SavedState = { summary: false, skills: false, motivation: false, closing: false }

export function GeneratePage() {
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [blurbs, setBlurbs] = useState<BlurbsState>(initBlurbs)
  const [loadingMap, setLoadingMap] = useState<LoadingState>(initLoading)
  const [savedMap, setSavedMap] = useState<SavedState>(initSaved)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listJobDescriptions()
      .then(setJobs)
      .catch(() => {})
  }, [])

  function setLoading(type: BlurbType, mode: BlurbMode | null) {
    setLoadingMap((prev) => ({ ...prev, [type]: mode }))
  }

  async function handleGenerate(type: BlurbType, mode: BlurbMode) {
    setLoading(type, mode)
    setError(null)
    try {
      const res = await generateBlurb({
        type,
        mode,
        previousBlurb: blurbs[type] || undefined,
        jobDescriptionId: selectedJobId || undefined,
      })
      setBlurbs((prev) => ({ ...prev, [type]: res.generatedBlurb }))
      setSavedMap((prev) => ({ ...prev, [type]: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed")
    } finally {
      setLoading(type, null)
    }
  }

  async function handleSave(type: BlurbType) {
    setError(null)
    try {
      await saveBlurb({
        type,
        content: blurbs[type],
        jobDescriptionId: selectedJobId || undefined,
      })
      setSavedMap((prev) => ({ ...prev, [type]: true }))
      setTimeout(() => setSavedMap((prev) => ({ ...prev, [type]: false })), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blurb")
    }
  }

  const isLoading = (type: BlurbType) => loadingMap[type] !== null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Generate CV Blurbs</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Select a job description, then generate and refine each section of your CV using AI.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {/* Job selector */}
      <div className="mb-8 flex flex-col gap-1.5">
        <Label>Target Job Description (optional)</Label>
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Select a job description…" />
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

      {/* Blurb sections */}
      <div className="flex flex-col gap-6">
        {BLURB_TYPES.map(({ type, label, description }) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                rows={4}
                value={blurbs[type]}
                onChange={(e) => {
                  setBlurbs((prev) => ({ ...prev, [type]: e.target.value }))
                  setSavedMap((prev) => ({ ...prev, [type]: false }))
                }}
                placeholder={`Your ${label.toLowerCase()} will appear here…`}
                disabled={isLoading(type)}
              />

              <div className="flex flex-wrap items-center gap-2">
                {/* Generate */}
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleGenerate(type, "full")}
                  disabled={isLoading(type)}
                >
                  {loadingMap[type] === "full" ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <Wand2 className="mr-1 h-4 w-4" />
                  )}
                  Generate
                </Button>

                {/* Rephrase */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(type, "modify")}
                  disabled={isLoading(type) || !blurbs[type]}
                >
                  {loadingMap[type] === "modify" ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <RefreshCw className="mr-1 h-4 w-4" />
                  )}
                  Rephrase
                </Button>

                {/* Check Grammar */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(type, "double-check")}
                  disabled={isLoading(type) || !blurbs[type]}
                >
                  {loadingMap[type] === "double-check" ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <SpellCheck className="mr-1 h-4 w-4" />
                  )}
                  Check Grammar
                </Button>

                {/* Save */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave(type)}
                  disabled={isLoading(type) || !blurbs[type]}
                  className={savedMap[type] ? "text-green-600" : ""}
                >
                  <Save className="mr-1 h-4 w-4" />
                  {savedMap[type] ? "Saved!" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
