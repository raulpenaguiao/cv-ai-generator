import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/LoadingSpinner"
import { listApiKeys, addApiKey, deleteApiKey } from "@/api/apiKeys"
import type { ApiKey } from "@/types"
import { Plus, Trash2, Key } from "lucide-react"

const PROVIDERS = ["openai"]

export function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", provider: "openai", key: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listApiKeys()
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await addApiKey(form.name, form.provider, form.key)
      setKeys((prev) => [...prev, created])
      setForm({ name: "", provider: "openai", key: "" })
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add key")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this API key?")) return
    try {
      await deleteApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
    } catch {
      // ignore
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
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
            <form onSubmit={handleAdd} className="rounded-lg border p-4 flex flex-col gap-4">
              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
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
                    <option key={p} value={p}>
                      {p}
                    </option>
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
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
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{key.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {key.provider}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
