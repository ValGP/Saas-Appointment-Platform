package com.turnos.api.business;

public class TenantContext {
    private static final ThreadLocal<Business> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(Business tenant) {
        CURRENT_TENANT.set(tenant);
    }

    public static Business getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
