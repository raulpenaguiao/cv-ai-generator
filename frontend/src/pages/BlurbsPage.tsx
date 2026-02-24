import { useState, useEffect } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/LoadingSpinner"
import { listBlurbs, deleteBlurb } from "@/api/blurbs"
import type { Blurb, BlurbType } from "@/types"
import { Trash2 } from "lucide-react"

const TYPE_LABELS: Record<BlurbType, string> = {
  summary: "Summary",
  skills: "Skills",
  motivation: "Motivation",
  closing: "Closing Statement",
}

const BLURB_TYPES: BlurbType[] = ["summary", "skills", "motivation", "closing"]

export function BlurbsPage() {
  const [blurbs, setBlurbs] = useState<Blurb[]>([])
  const [loading, setLoading] = useState(true)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    listBlurbs()
      .then(setBlurbs)
      .catch(() => setBackendDown(true))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this blurb?")) return
    try {
      await deleteBlurb(id)
      setBlurbs((prev) => prev.filter((b) => b.id !== id))
    } catch {
      // ignore
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Saved Blurbs</h1>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to view saved blurbs.
        </div>
      )}

      {blurbs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No blurbs saved yet. Generate some on the Generate page.
        </p>
      )}

      <div className="flex flex-col gap-8">
        {BLURB_TYPES.map((type) => {
          const typeBlurbs = blurbs.filter((b) => b.type === type)
          if (typeBlurbs.length === 0) return null
          return (
            <div key={type}>
              <h2 className="mb-3 text-lg font-semibold">{TYPE_LABELS[type]}</h2>
              <div className="flex flex-col gap-3">
                {typeBlurbs.map((blurb) => (
                  <Card key={blurb.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {blurb.jobDescriptionId && (
                            <Badge variant="outline" className="mb-2">
                              Linked to job
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive shrink-0"
                          onClick={() => handleDelete(blurb.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{blurb.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
