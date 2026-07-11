import { apiRequest } from "../../../shared/api/httpClient";
import { tokenStorage } from "../../../shared/api/tokenStorage";
import { type CurrentUser, type UserRole } from "../../../shared/types/user";

export type AuthResponse = {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

export type UpdateCurrentUserPayload = {
  fullName: string;
  phone?: string;
};

export async function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerClient(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/users/me");
}

export async function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  return apiRequest<CurrentUser>("/api/users/me", {
    method: "PUT",
    body: payload,
  });
}

export function persistAuthResponse(response: AuthResponse): CurrentUser {
  tokenStorage.set(response.token);

  return {
    id: response.userId,
    fullName: response.fullName,
    email: response.email,
    role: response.role,
    active: true,
  };
}
