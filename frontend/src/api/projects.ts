import { get, post, put, del } from "@/lib/fetchClient"
import type { Project } from "@/types"

export function listProjects(): Promise<Project[]> {
  return get<Project[]>("/projects")
}

export function addProject(data: Omit<Project, "id">): Promise<Project> {
  return post<Project>("/projects", data)
}

export function updateProject(id: string, data: Omit<Project, "id">): Promise<Project> {
  return put<Project>(`/projects/${id}`, data)
}

export function deleteProject(id: string): Promise<void> {
  return del<void>(`/projects/${id}`)
}
