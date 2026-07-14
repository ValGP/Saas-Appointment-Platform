import { apiRequest } from "../../../shared/api/httpClient";

export type BusinessConfig = {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  whatsapp: string | null;
  primaryColor: string | null;
  themePreset: string | null;
  bookingEnabled: boolean;
  showBranding: boolean;
};

export type BusinessUpdatePayload = {
  name: string;
  whatsapp: string;
  primaryColor: string;
  showBranding: boolean;
};

export function getMyBusiness() {
  return apiRequest<BusinessConfig>("/api/businesses/my");
}

export function updateMyBusiness(payload: BusinessUpdatePayload) {
  return apiRequest<BusinessConfig>("/api/businesses/my", {
    method: "PUT",
    body: payload,
  });
}
