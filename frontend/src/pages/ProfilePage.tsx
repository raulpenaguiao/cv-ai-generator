import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/LoadingSpinner"
import { getProfile, saveProfile, uploadPhoto, deletePhoto, setMainPhoto } from "@/api/profile"
import type { Profile, Photo } from "@/types"

const FIELDS: { key: keyof Omit<Profile, "id" | "updatedAt">; label: string; type?: string }[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "website", label: "Website", type: "url" },
  { key: "linkedin", label: "LinkedIn URL", type: "url" },
  { key: "github", label: "GitHub URL", type: "url" },
]

const empty: Omit<Profile, "id" | "updatedAt"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
}

export function ProfilePage() {
  const [form, setForm] = useState(empty)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    getProfile()
      .then((p) => {
        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          location: p.location ?? "",
          website: p.website ?? "",
          linkedin: p.linkedin ?? "",
          github: p.github ?? "",
        })
      })
      .catch(() => setBackendDown(true))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await saveProfile(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const photo = await uploadPhoto(file)
      setPhotos((prev) => [...prev, photo])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo")
    }
    e.target.value = ""
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await deletePhoto(photoId)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo")
    }
  }

  async function handleSetMain(photoId: string) {
    try {
      await setMainPhoto(photoId)
      setPhotos((prev) => prev.map((p) => ({ ...p, isMain: p.id === photoId })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set main photo")
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      {backendDown && (
        <div className="mb-6 rounded-md border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Backend not running.</strong> Start the Flask server (<code className="font-mono">python run.py</code>) to view and save your profile.
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          Profile saved successfully.
        </p>
      )}

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type ?? "text"}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={label}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving || backendDown} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </form>

      {/* Photo section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="photo-upload" className={backendDown ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
              <Button variant="outline" size="sm" asChild>
                <span>Upload Photo</span>
              </Button>
            </Label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={backendDown}
            />
          </div>

          {photos.length === 0 && (
            <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
          )}

          <div className="flex flex-wrap gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={photo.url}
                    alt="Profile photo"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  {photo.isMain && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      Main
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {!photo.isMain && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetMain(photo.id)}>
                      Set Main
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
