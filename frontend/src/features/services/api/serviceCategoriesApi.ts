import { apiRequest } from "../../../shared/api/httpClient";

export type ServiceCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
};

export type ServiceCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
};

export function getServiceCategories() {
  return apiRequest<ServiceCategory[]>("/api/service-categories");
}

export function getPublicServiceCategories() {
  return apiRequest<ServiceCategory[]>("/api/public/service-categories");
}

export function createServiceCategory(payload: ServiceCategoryPayload) {
  return apiRequest<ServiceCategory>("/api/service-categories", {
    method: "POST",
    body: payload,
  });
}

export function updateServiceCategory(id: number, payload: ServiceCategoryPayload) {
  return apiRequest<ServiceCategory>(`/api/service-categories/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function setServiceCategoryActive(id: number, active: boolean) {
  return apiRequest<ServiceCategory>(
    `/api/service-categories/${id}/${active ? "activate" : "deactivate"}`,
    {
      method: "PATCH",
    },
  );
}
