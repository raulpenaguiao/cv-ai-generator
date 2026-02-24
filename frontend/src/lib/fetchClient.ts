const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem("cv_token")
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (!isFormData) headers["Content-Type"] = "application/json"
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    let message = text || res.statusText
    try {
      const json = JSON.parse(text)
      const err = json?.error
      if (typeof err === "string") message = err
      else if (typeof err?.message === "string") message = err.message
    } catch {
      // not JSON — use raw text as-is
    }
    throw new Error(message)
  }
  const contentType = res.headers.get("Content-Type") ?? ""
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>
  }
  return undefined as T
}

export function get<T>(path: string): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: getHeaders(),
  }).then((res) => handleResponse<T>(res))
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((res) => handleResponse<T>(res))
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((res) => handleResponse<T>(res))
}

export function del<T>(path: string): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then((res) => handleResponse<T>(res))
}

export function postFormData<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  }).then((res) => handleResponse<T>(res))
}
