import { get, post, put, del } from "@/lib/fetchClient"
import type { Experience } from "@/types"

export function listExperiences(): Promise<Experience[]> {
  return get<Experience[]>("/experiences")
}

export function addExperience(data: Omit<Experience, "id">): Promise<Experience> {
  return post<Experience>("/experiences", data)
}

export function updateExperience(id: string, data: Omit<Experience, "id">): Promise<Experience> {
  return put<Experience>(`/experiences/${id}`, data)
}

export function deleteExperience(id: string): Promise<void> {
  return del<void>(`/experiences/${id}`)
}
