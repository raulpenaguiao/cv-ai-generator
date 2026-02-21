import { get, post, put, del } from "@/lib/fetchClient"
import type { ApiKey } from "@/types"

export function listApiKeys(): Promise<ApiKey[]> {
  return get<ApiKey[]>("/api-keys")
}

export function addApiKey(name: string, provider: string, key: string): Promise<ApiKey> {
  return post<ApiKey>("/api-keys", { name, provider, key })
}

export function updateApiKey(id: string, name: string, key?: string): Promise<ApiKey> {
  return put<ApiKey>(`/api-keys/${id}`, { name, key })
}

export function deleteApiKey(id: string): Promise<void> {
  return del<void>(`/api-keys/${id}`)
}
