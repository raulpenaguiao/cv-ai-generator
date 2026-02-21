import { post } from "@/lib/fetchClient"
import type { CompileRequest, CompileResponse } from "@/types"

export function compileCV(data: CompileRequest): Promise<CompileResponse> {
  return post<CompileResponse>("/latex/compile", data)
}

export function getDownloadUrl(filename: string): string {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:5000"
  return `${base}/latex/download/${filename}`
}

export function getTexDownloadUrl(filename: string): string {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:5000"
  return `${base}/latex/download-tex/${filename}`
}
