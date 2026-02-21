import { post } from "@/lib/fetchClient"
import type { GenerateBlurbRequest, GenerateBlurbResponse, JobAnalysis } from "@/types"

export function generateBlurb(data: GenerateBlurbRequest): Promise<GenerateBlurbResponse> {
  return post<GenerateBlurbResponse>("/agent/generate-blurb", data)
}

export function analyzeJob(jobDescriptionId: string): Promise<JobAnalysis> {
  return post<JobAnalysis>("/agent/analyze-job", { jobDescriptionId })
}
