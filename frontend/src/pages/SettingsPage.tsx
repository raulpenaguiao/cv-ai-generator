import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { LoadingSpinner, PageLoader } from "@/components/LoadingSpinner"
import { listApiKeys, addApiKey, deleteApiKey } from "@/api/apiKeys"
import { listExperiences } from "@/api/experiences"
import { listProjects } from "@/api/projects"
import { listBlurbs } from "@/api/blurbs"
import { compileCV, fetchPdfBlobUrl } from "@/api/latex"
import type { ApiKey, Experience, Project, Blurb } from "@/types"
import { Plus, Trash2, Key, FileText, Download, Upload, PackageOpen } from "lucide-react"
import { exportData, importData } from "@/api/exportImport"

const PROVIDERS = ["openai"]
const FONT_SIZES = [10, 11, 12]
const TEMPLATES = [{ value: "modern-1", label: "Modern (default)" }]

export function SettingsPage() {
  // API keys
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", provider: "openai", key: "" })
  const [saving, setSaving] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [backendDown, setBackendDown] = useState(false)

  // Compile
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [blurbs, setBlurbs] = useState<Blurb[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("modern-1")
  const [fontSize, setFontSize] = useState(11)
  const [selectedExpIds, setSelectedExpIds] = useState<Set<string>>(new Set())
  const [selectedProjIds, setSelectedProjIds] = useState<Set<string>>(new Set())
  const [selectedBlurbIds, setSelectedBlurbIds] = useState<Set<string>>(new Set())
  const [compiling, setCompiling] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)

  // Import / Export
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  useEffect(() => {
    listApiKeys()
      .then(setKeys)
      .catch(() => setBackendDown(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([listExperiences(), listProjects(), listBlurbs()])
      .then(([exps, projs, blrbs]) => {
        setExperiences(exps)
        setProjects(projs)
        setBlurbs(blrbs)
        setSelectedExpIds(new Set(exps.map((e) => e.id)))
        setSelectedProjIds(new Set(projs.map((p) => p.id)))
        setSelectedBlurbIds(new Set(blrbs.map((b) => b.id)))
      })
      .catch(() => {})
  }, [])

  async function handleAddKey(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setKeyError(null)
    try {
      const created = await addApiKey(form.name, form.provider, form.key)
      setKeys((prev) => [...prev, created])
      setForm({ name: "", provider: "openai", key: "" })
      setShowForm(false)
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to add key")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteKey(id: string) {
    if (!confirm("Delete this API key?")) return
    try {
      await deleteApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
    } catch {
      // ignore
    }
  }

  function toggleId(set: Set<string>, id: string): Set<string> {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  async function handleCompile() {
    setCompiling(true)
    setCompileError(null)
    setPdfBlobUrl(null)
    try {
      const res = await compileCV({
        template: selectedTemplate,
        fontSize,
        blurbIds: [...selectedBlurbIds],
        experienceIds: [...selectedExpIds],
        projectIds: [...selectedProjIds],
      })
      setPdfBlobUrl(await fetchPdfBlobUrl(res.pdfUrl))
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : "Compilation failed")
    } finally {
      setCompiling(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    setTransferError(null)
    try {
      await exportData()
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setTransferError(null)
    setImportSuccess(false)
    try {
      await importData(file)
      setImportSuccess(true)
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to manage settings and compile your CV.
        </div>
      )}

      {/* API Keys */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(!showForm)} disabled={backendDown}>
              <Plus className="mr-1 h-4 w-4" />
              Add Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Your API keys are encrypted at rest and never shown in plaintext after creation.
          </p>

          {showForm && (
            <form onSubmit={handleAddKey} className="rounded-lg border p-4 flex flex-col gap-4">
              {keyError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{keyError}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My OpenAI Key"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="key-provider">Provider</Label>
                <select
                  id="key-provider"
                  value={form.provider}
                  onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="key-value">API Key</Label>
                <Input
                  id="key-value"
                  type="password"
                  value={form.key}
                  onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                  placeholder="sk-…"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : "Save Key"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {keys.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground">No API keys stored yet.</p>
          )}

          <div className="flex flex-col gap-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{key.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{key.provider}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDeleteKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import / Export */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5" />
            Import / Export
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Export all your data (profile, photos, experiences, projects, job descriptions, blurbs)
            as a ZIP archive. Import a previously exported archive to restore your data.
            API keys are not included in the export.
          </p>

          {transferError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{transferError}</p>
          )}
          {importSuccess && (
            <p className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              Import successful. Refresh any open pages to see the updated data.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting || backendDown}
            >
              {exporting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? "Exporting…" : "Export data"}
            </Button>

            <Label
              htmlFor="import-zip"
              className={backendDown ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            >
              <Button variant="outline" asChild disabled={importing || backendDown}>
                <span>
                  {importing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {importing ? "Importing…" : "Import data"}
                </span>
              </Button>
            </Label>
            <input
              id="import-zip"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImport}
              disabled={importing || backendDown}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compile CV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compile CV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {compileError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{compileError}</p>
          )}

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                    <SelectItem key={s} value={String(s)}>{s}pt</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blurbs */}
          {blurbs.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Blurbs to include</p>
              <div className="flex flex-col gap-2">
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
              </div>
            </div>
          )}

          {/* Experiences */}
          {experiences.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Experiences to include</p>
              <div className="flex flex-col gap-2">
                {experiences.map((exp) => (
                  <label key={exp.id} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExpIds.has(exp.id)}
                      onChange={() => setSelectedExpIds(toggleId(selectedExpIds, exp.id))}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{exp.title}</span>{" "}
                      <span className="text-muted-foreground">· {exp.organization} · {exp.category}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Projects to include</p>
              <div className="flex flex-col gap-2">
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
              </div>
            </div>
          )}

          <Button onClick={handleCompile} disabled={compiling || backendDown} className="w-full sm:w-auto">
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

          {pdfBlobUrl && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 flex flex-col gap-3">
              <p className="font-medium text-green-700 dark:text-green-400">CV compiled successfully!</p>
              <Button asChild className="w-full sm:w-auto">
                <a href={pdfBlobUrl} download="cv.pdf">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
