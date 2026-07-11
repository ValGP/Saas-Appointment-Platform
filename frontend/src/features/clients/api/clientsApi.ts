import { apiRequest } from "../../../shared/api/httpClient";

export type Client = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
};

export type ClientPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
};

export function getClients() {
  return apiRequest<Client[]>("/api/clients");
}

export function createClient(payload: ClientPayload) {
  return apiRequest<Client>("/api/clients", {
    method: "POST",
    body: payload,
  });
}

export function updateClient(id: number, payload: ClientPayload) {
  return apiRequest<Client>(`/api/clients/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setClientActive(id: number, active: boolean) {
  return apiRequest<Client>(
    `/api/clients/${id}/${active ? "activate" : "deactivate"}`,
    {
      method: "PATCH",
    },
  );
}
