import { apiRequest } from "../../../shared/api/httpClient";

export type AvailabilityBlockType =
  | "VACATION"
  | "SICK_LEAVE"
  | "HOLIDAY"
  | "MANUAL_BLOCK"
  | "OTHER";

export type AvailabilityBlock = {
  id: number;
  professionalId: number;
  professionalName: string;
  startDateTime: string;
  endDateTime: string;
  reason: string | null;
  type: AvailabilityBlockType;
  active: boolean;
  createdAt: string;
};

export type AvailabilityBlockPayload = {
  professionalId: number;
  startDateTime: string;
  endDateTime: string;
  reason?: string;
  type: AvailabilityBlockType;
};

export function getAvailabilityBlocks() {
  return apiRequest<AvailabilityBlock[]>("/api/availability-blocks");
}

export function createAvailabilityBlock(payload: AvailabilityBlockPayload) {
  return apiRequest<AvailabilityBlock>("/api/availability-blocks", {
    method: "POST",
    body: payload,
  });
}

export function updateAvailabilityBlock(
  id: number,
  payload: AvailabilityBlockPayload,
) {
  return apiRequest<AvailabilityBlock>(`/api/availability-blocks/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setAvailabilityBlockActive(id: number, active: boolean) {
  return apiRequest<AvailabilityBlock>(
    `/api/availability-blocks/${id}/${active ? "activate" : "deactivate"}`,
    { method: "PATCH" },
  );
}
