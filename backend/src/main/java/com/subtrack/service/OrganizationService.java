package com.subtrack.service;

import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Organization getProfile() {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));
    }

    @Transactional
    public Organization updateProfile(String name) {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        org.setName(name);
        return organizationRepository.save(org);
    }

    @Transactional(readOnly = true)
    public List<User> getMembers() {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");
        return userRepository.findByOrganizationId(orgId);
    }

    @Transactional
    public User inviteUser(String name, String email, String roleStr) {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with this email is already registered");
        }

        UserRole role = UserRole.valueOf(roleStr);
        String token = UUID.randomUUID().toString();

        User invited = new User();
        invited.setOrganizationId(orgId);
        invited.setName(name);
        invited.setEmail(email);
        invited.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString().substring(0, 10))); // temporary password
        invited.setRole(role);
        invited.setStatus("PENDING_VERIFICATION");
        invited.setEmailVerificationToken(token);

        return userRepository.save(invited);
    }

    @Transactional
    public User updateUserRole(Long userId, String roleStr) {
        Long orgId = TenantContext.getCurrentTenant();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getOrganizationId().equals(orgId)) {
            throw new SecurityException("Unauthorized role update across tenants");
        }

        user.setRole(UserRole.valueOf(roleStr));
        return userRepository.save(user);
    }

    @Transactional
    public void deleteMember(Long userId) {
        Long orgId = TenantContext.getCurrentTenant();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getOrganizationId().equals(orgId)) {
            throw new SecurityException("Unauthorized member deletion across tenants");
        }
        
        userRepository.delete(user);
    }
}
