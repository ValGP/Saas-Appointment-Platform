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

export function getPublicAvailability(params: AvailabilitySearchParams) {
  const searchParams = new URLSearchParams({
    professionalId: String(params.professionalId),
    serviceId: String(params.serviceId),
    date: params.date,
  });

  return apiRequest<AvailabilitySlot[]>(`/api/public/availability?${searchParams}`);
}

// ─── Unified Availability (Any Professional) ───────────────────────────────

export type AvailableSlotsSearchParams = {
  serviceId: number;
  date: string;
  professionalId?: number;
};

export type AvailableSlot = {
  start: string;
  end: string;
  availableProfessionalsCount?: number | null;
};

export type PublicAvailabilitySlot = AvailabilitySlot & {
  availableProfessionalsCount?: number | null;
};

export function getAvailableSlots(params: AvailableSlotsSearchParams) {
  const searchParams = new URLSearchParams({
    serviceId: String(params.serviceId),
    date: params.date,
  });

  if (params.professionalId !== undefined && params.professionalId !== null) {
    searchParams.set("professionalId", String(params.professionalId));
  }

  return apiRequest<AvailableSlot[]>(`/api/availability/available-slots?${searchParams}`)
    .then((slots) =>
      slots.map((s) => ({
        startDateTime: s.start,
        endDateTime: s.end,
        availableProfessionalsCount: s.availableProfessionalsCount,
      }))
    );
}

export function getPublicAvailableSlots(params: AvailableSlotsSearchParams) {
  const searchParams = new URLSearchParams({
    serviceId: String(params.serviceId),
    date: params.date,
  });

  if (params.professionalId !== undefined && params.professionalId !== null) {
    searchParams.set("professionalId", String(params.professionalId));
  }

  return apiRequest<AvailableSlot[]>(`/api/public/available-slots?${searchParams}`)
    .then((slots) =>
      slots.map((s) => ({
        startDateTime: s.start,
        endDateTime: s.end,
        availableProfessionalsCount: s.availableProfessionalsCount,
      }))
    );
}
