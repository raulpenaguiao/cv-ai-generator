import { get, post, put, del } from "@/lib/fetchClient"
import type { JobDescription } from "@/types"

export function listJobDescriptions(): Promise<JobDescription[]> {
  return get<JobDescription[]>("/job-descriptions")
}

export function addJobDescription(data: Pick<JobDescription, "title" | "company" | "description">): Promise<JobDescription> {
  return post<JobDescription>("/job-descriptions", data)
}

export function updateJobDescription(
  id: string,
  data: Pick<JobDescription, "title" | "company" | "description">,
): Promise<JobDescription> {
  return put<JobDescription>(`/job-descriptions/${id}`, data)
}

export function deleteJobDescription(id: string): Promise<void> {
  return del<void>(`/job-descriptions/${id}`)
}
