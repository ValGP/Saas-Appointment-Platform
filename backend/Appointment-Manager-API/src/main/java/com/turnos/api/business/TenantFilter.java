package com.turnos.api.business;

import com.turnos.api.auth.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private final BusinessRepository businessRepository;

    public TenantFilter(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Business resolvedBusiness = null;

        // 1. Try to resolve from the authenticated security context first (prevents header bypass on protected endpoints)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof AuthenticatedUser) {

            AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
            Long businessId = authenticatedUser.getBusinessId();
            if (businessId != null) {
                resolvedBusiness = businessRepository.findById(businessId).orElse(null);
            }
        }

        // 2. Otherwise (public endpoints, login/register), resolve from the X-Business-Slug header
        if (resolvedBusiness == null) {
            String businessSlug = request.getHeader("X-Business-Slug");
            if (businessSlug != null && !businessSlug.isBlank()) {
                resolvedBusiness = businessRepository.findBySlugIgnoreCase(businessSlug.trim()).orElse(null);
            }
        }


        // 3. Set the resolved business in TenantContext (if found)
        if (resolvedBusiness != null) {
            TenantContext.setCurrentTenant(resolvedBusiness);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Avoid ThreadLocal leaks
            TenantContext.clear();
        }
    }
}
