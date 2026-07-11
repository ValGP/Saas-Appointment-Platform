import { apiRequest } from "../../../shared/api/httpClient";
import { type PageResponse } from "../../../shared/types/page";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELED_BY_CLIENT"
  | "CANCELED_BY_ADMIN"
  | "COMPLETED"
  | "NO_SHOW";

export type Appointment = {
  id: number;
  clientId: number;
  clientName: string;
  professionalId: number;
  professionalName: string;
  serviceId: number;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  cancelReason?: string | null;
  rejectionReason?: string | null;
  createdByRole: "ADMIN" | "CLIENT";
  confirmedAt?: string | null;
  canceledAt?: string | null;
  completedAt?: string | null;
  noShowAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentSearchParams = {
  clientId?: number;
  professionalId?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type AppointmentPayload = {
  clientId?: number;
  professionalId: number;
  serviceId: number;
  startDateTime: string;
  notes?: string;
};

export type AppointmentTransitionPayload = {
  reason?: string;
};

export function getAppointments(params: AppointmentSearchParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiRequest<PageResponse<Appointment>>(
    `/api/appointments${query ? `?${query}` : ""}`,
  );
}

export function createAppointment(payload: AppointmentPayload) {
  return apiRequest<Appointment>("/api/appointments", {
    method: "POST",
    body: payload,
  });
}

export function confirmAppointment(id: number) {
  return apiRequest<Appointment>(`/api/appointments/${id}/confirm`, {
    method: "PATCH",
  });
}

export function rejectAppointment(
  id: number,
  payload: AppointmentTransitionPayload,
) {
  return apiRequest<Appointment>(`/api/appointments/${id}/reject`, {
    method: "PATCH",
    body: payload,
  });
}

export function cancelAppointmentByAdmin(
  id: number,
  payload: AppointmentTransitionPayload,
) {
  return apiRequest<Appointment>(`/api/appointments/${id}/cancel-by-admin`, {
    method: "PATCH",
    body: payload,
  });
}

export function cancelAppointmentByClient(
  id: number,
  payload: AppointmentTransitionPayload,
) {
  return apiRequest<Appointment>(`/api/appointments/${id}/cancel-by-client`, {
    method: "PATCH",
    body: payload,
  });
}

export function completeAppointment(id: number) {
  return apiRequest<Appointment>(`/api/appointments/${id}/complete`, {
    method: "PATCH",
  });
}

export function markAppointmentNoShow(id: number) {
  return apiRequest<Appointment>(`/api/appointments/${id}/no-show`, {
    method: "PATCH",
  });
}
