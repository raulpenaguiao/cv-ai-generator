import { post } from "@/lib/fetchClient"
import type { LoginResponse, RegisterResponse } from "@/types"

export function login(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>("/auth/login", { email, password })
}

export function register(email: string): Promise<RegisterResponse> {
  return post<RegisterResponse>("/auth/register", { email })
}

export function logout(): Promise<void> {
  return post<void>("/auth/logout")
}

export function requestPasswordReset(email: string): Promise<void> {
  return post<void>("/auth/reset-password/request", { email })
}

export function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  return post<void>("/auth/reset-password/confirm", { token, newPassword })
}
