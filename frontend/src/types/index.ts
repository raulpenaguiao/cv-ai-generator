// Auth
export interface LoginResponse {
  token: string
  userId: string
}

export interface RegisterResponse {
  generatedPassword: string
  userId: string
}

// Profile
export interface Profile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
  updatedAt?: string
}

export interface Photo {
  id: string
  filename: string
  isMain: boolean
  url: string
}

// Experience
export type ExperienceCategory = "work" | "education" | "hobby"

export interface Experience {
  id: string
  category: ExperienceCategory
  title: string
  organization: string
  startDate: string
  endDate: string | null
  description: string
  keywords: string[]
}

// Project
export interface Project {
  id: string
  title: string
  description: string
  keywords: string[]
}

// Job Description
export interface JobAnalysis {
  keywords: string[]
  requiredSkills: string[]
  seniorityLevel: string
}

export interface JobDescription {
  id: string
  title: string
  company: string
  description: string
  analysis?: JobAnalysis
}

// Blurb
export type BlurbType = "summary" | "skills" | "motivation" | "closing"
export type BlurbMode = "full" | "modify" | "double-check"

export interface Blurb {
  id: string
  type: BlurbType
  content: string
  jobDescriptionId: string | null
}

export interface GenerateBlurbRequest {
  type: BlurbType
  mode: BlurbMode
  previousBlurb?: string
  jobDescriptionId?: string
}

export interface GenerateBlurbResponse {
  generatedBlurb: string
}

// API Keys
export interface ApiKey {
  id: string
  name: string
  provider: string
  createdAt: string
}

// Compile
export interface CompileRequest {
  template: string
  fontSize: number
  blurbIds: string[]
  experienceIds: string[]
  projectIds: string[]
}

export interface CompileResponse {
  pdfUrl: string
}
