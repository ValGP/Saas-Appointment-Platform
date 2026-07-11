import { apiRequest } from "../../../shared/api/httpClient";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type BusinessHours = {
  id: number;
  professionalId: number;
  professionalName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type BusinessHoursPayload = {
  professionalId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export function getBusinessHours() {
  return apiRequest<BusinessHours[]>("/api/business-hours");
}

export function createBusinessHours(payload: BusinessHoursPayload) {
  return apiRequest<BusinessHours>("/api/business-hours", {
    method: "POST",
    body: payload,
  });
}

export function updateBusinessHours(id: number, payload: BusinessHoursPayload) {
  return apiRequest<BusinessHours>(`/api/business-hours/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setBusinessHoursActive(id: number, active: boolean) {
  return apiRequest<BusinessHours>(
    `/api/business-hours/${id}/${active ? "activate" : "deactivate"}`,
    { method: "PATCH" },
  );
}
