const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("cv_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function exportData(): Promise<void> {
  const res = await fetch(`${BASE_URL}/export`, { headers: authHeader() })
  if (!res.ok) throw new Error("Export failed")
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "cv-export.zip"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<void> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`${BASE_URL}/import`, {
    method: "POST",
    headers: authHeader(),
    body: fd,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error?.message ?? "Import failed")
  }
}
