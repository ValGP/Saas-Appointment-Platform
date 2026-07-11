export type UserRole = "ADMIN" | "CLIENT";

export type CurrentUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  active?: boolean;
};
