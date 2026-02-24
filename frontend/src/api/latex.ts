import { post } from "@/lib/fetchClient"
import type { CompileRequest, CompileResponse } from "@/types"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

export function compileCV(data: CompileRequest): Promise<CompileResponse> {
  return post<CompileResponse>("/latex/compile", data)
}

/** Fetch the PDF with auth and return a local blob URL safe for <a> and <iframe>. */
export async function fetchPdfBlobUrl(pdfPath: string): Promise<string> {
  const token = localStorage.getItem("cv_token")
  const res = await fetch(`${BASE_URL}${pdfPath}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to download PDF")
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
