import { apiRequest } from "../../../shared/api/httpClient";

export type Professional = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  active: boolean;
};

export type ProfessionalPayload = {
  fullName: string;
  email: string;
  phone?: string;
};

export type ProfessionalSearchParams = {
  serviceId?: number;
  hasAvailability?: boolean;
};

export type ServiceAssignmentMode = "ALL_SERVICES" | "SELECTED_SERVICES";

export type ProfessionalServicesAssignment = {
  professionalId: number;
  mode: ServiceAssignmentMode;
  services: Array<{
    id: number;
    name: string;
    active: boolean;
  }>;
};

export type ProfessionalServicesAssignmentPayload = {
  mode: ServiceAssignmentMode;
  serviceIds: number[];
};

export function getProfessionals(params: ProfessionalSearchParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.serviceId !== undefined) {
    searchParams.set("serviceId", String(params.serviceId));
  }
  if (params.hasAvailability !== undefined) {
    searchParams.set("hasAvailability", String(params.hasAvailability));
  }

  const query = searchParams.toString();
  return apiRequest<Professional[]>(`/api/professionals${query ? `?${query}` : ""}`);
}

export function createProfessional(payload: ProfessionalPayload) {
  return apiRequest<Professional>("/api/professionals", {
    method: "POST",
    body: payload,
  });
}

export function updateProfessional(id: number, payload: ProfessionalPayload) {
  return apiRequest<Professional>(`/api/professionals/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setProfessionalActive(id: number, active: boolean) {
  return apiRequest<Professional>(
    `/api/professionals/${id}/${active ? "activate" : "deactivate"}`,
    {
      method: "PATCH",
    },
  );
}

export function getProfessionalServicesAssignment(id: number) {
  return apiRequest<ProfessionalServicesAssignment>(
    `/api/professionals/${id}/services`,
  );
}

export function updateProfessionalServicesAssignment(
  id: number,
  payload: ProfessionalServicesAssignmentPayload,
) {
  return apiRequest<ProfessionalServicesAssignment>(
    `/api/professionals/${id}/services`,
    {
      method: "PUT",
      body: payload,
    },
  );
}
