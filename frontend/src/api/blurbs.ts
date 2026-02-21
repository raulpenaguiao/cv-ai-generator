import { get, post, put, del } from "@/lib/fetchClient"
import type { Blurb, BlurbType } from "@/types"

export function listBlurbs(jobDescriptionId?: string): Promise<Blurb[]> {
  const query = jobDescriptionId ? `?jobDescriptionId=${jobDescriptionId}` : ""
  return get<Blurb[]>(`/blurbs${query}`)
}

export function saveBlurb(data: {
  type: BlurbType
  content: string
  jobDescriptionId?: string
}): Promise<Blurb> {
  return post<Blurb>("/blurbs", data)
}

export function updateBlurb(id: string, content: string): Promise<Blurb> {
  return put<Blurb>(`/blurbs/${id}`, { content })
}

export function deleteBlurb(id: string): Promise<void> {
  return del<void>(`/blurbs/${id}`)
}
