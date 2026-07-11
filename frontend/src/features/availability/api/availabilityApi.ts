import { apiRequest } from "../../../shared/api/httpClient";

export type AvailabilitySlot = {
  startDateTime: string;
  endDateTime: string;
};

export type AvailabilitySearchParams = {
  professionalId: number;
  serviceId: number;
  date: string;
};

export function getAvailability(params: AvailabilitySearchParams) {
  const searchParams = new URLSearchParams({
    professionalId: String(params.professionalId),
    serviceId: String(params.serviceId),
    date: params.date,
  });

  return apiRequest<AvailabilitySlot[]>(`/api/availability?${searchParams}`);
}
