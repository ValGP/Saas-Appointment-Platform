import { apiRequest } from "../../../shared/api/httpClient";

export type ServiceCatalogItem = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  onlineBookable: boolean;
  requiresEvaluation: boolean;
};

export type ServicePayload = {
  name: string;
  categoryId: number;
  description?: string;
  durationMinutes: number;
  price: number;
  onlineBookable: boolean;
  requiresEvaluation: boolean;
};

export type ServiceSearchParams = {
  categoryId?: number;
  onlineBookableOnly?: boolean;
  professionalId?: number;
};

export type ServiceProfessionalAssignmentMode =
  | "ALL_PROFESSIONALS"
  | "SELECTED_PROFESSIONALS";

export type ServiceProfessionalsAssignment = {
  serviceId: number;
  mode: ServiceProfessionalAssignmentMode;
  professionals: Array<{
    id: number;
    fullName: string;
    active: boolean;
    serviceAssignmentMode: string;
  }>;
};

export type ServiceProfessionalsAssignmentPayload = {
  mode: ServiceProfessionalAssignmentMode;
  professionalIds: number[];
};

export function getServices(params: ServiceSearchParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.categoryId !== undefined) {
    searchParams.set("categoryId", String(params.categoryId));
  }

  if (params.professionalId !== undefined) {
    searchParams.set("professionalId", String(params.professionalId));
  }

  if (params.onlineBookableOnly !== undefined) {
    searchParams.set("onlineBookableOnly", String(params.onlineBookableOnly));
  }

  const query = searchParams.toString();
  return apiRequest<ServiceCatalogItem[]>(`/api/services${query ? `?${query}` : ""}`);
}

export function createService(payload: ServicePayload) {
  return apiRequest<ServiceCatalogItem>("/api/services", {
    method: "POST",
    body: payload,
  });
}

export function updateService(id: number, payload: ServicePayload) {
  return apiRequest<ServiceCatalogItem>(`/api/services/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setServiceActive(id: number, active: boolean) {
  return apiRequest<ServiceCatalogItem>(
    `/api/services/${id}/${active ? "activate" : "deactivate"}`,
    {
      method: "PATCH",
    },
  );
}

export function getServiceProfessionalsAssignment(id: number) {
  return apiRequest<ServiceProfessionalsAssignment>(
    `/api/services/${id}/professionals`,
  );
}

export function updateServiceProfessionalsAssignment(
  id: number,
  payload: ServiceProfessionalsAssignmentPayload,
) {
  return apiRequest<ServiceProfessionalsAssignment>(
    `/api/services/${id}/professionals`,
    {
      method: "PUT",
      body: payload,
    },
  );
}
