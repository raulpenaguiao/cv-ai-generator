import { get, put, del, postFormData } from "@/lib/fetchClient"
import type { Profile, Photo } from "@/types"

export function getProfile(): Promise<Profile> {
  return get<Profile>("/profile")
}

export function saveProfile(data: Omit<Profile, "id" | "updatedAt">): Promise<{ id: string; updatedAt: string }> {
  return put("/profile", data)
}

export function uploadPhoto(file: File): Promise<Photo> {
  const fd = new FormData()
  fd.append("photo", file)
  return postFormData<Photo>("/profile/photos", fd)
}

export function deletePhoto(photoId: string): Promise<void> {
  return del<void>(`/profile/photos/${photoId}`)
}

export function setMainPhoto(photoId: string): Promise<void> {
  return put<void>(`/profile/photos/${photoId}/select-main`)
}
