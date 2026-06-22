package com.subtrack.service;

import com.subtrack.model.License;
import com.subtrack.model.Subscription;
import com.subtrack.model.User;
import com.subtrack.repository.LicenseRepository;
import com.subtrack.repository.SubscriptionRepository;
import com.subtrack.repository.UserRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LicenseService {

    private final LicenseRepository licenseRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public LicenseService(
            LicenseRepository licenseRepository,
            SubscriptionRepository subscriptionRepository,
            UserRepository userRepository) {
        this.licenseRepository = licenseRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<License> getAllLicenses() {
        return licenseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<License> getLicensesBySubscription(Long subId) {
        return licenseRepository.findBySubscriptionId(subId);
    }

    @Transactional(readOnly = true)
    public License getLicenseById(Long id) {
        return licenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("License not found with ID: " + id));
    }

    @Transactional
    public License createLicense(License license, Long subscriptionId) {
        Long orgId = TenantContext.getCurrentTenant();
        license.setOrganizationId(orgId);

        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        license.setSubscription(sub);
        license.setStatus("AVAILABLE");
        license.setUtilizationPercentage(0);

        return licenseRepository.save(license);
    }

    @Transactional
    public License assignLicense(Long id, Long userId) {
        License license = getLicenseById(id);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        license.setAssignedTo(user);
        license.setStatus("ASSIGNED");
        license.setUtilizationPercentage(100); // Set initial mock utilization
        license.setLastUsedAt(LocalDateTime.now());

        return licenseRepository.save(license);
    }

    @Transactional
    public License revokeLicense(Long id) {
        License license = getLicenseById(id);
        license.setAssignedTo(null);
        license.setStatus("AVAILABLE");
        license.setUtilizationPercentage(0);
        license.setLastUsedAt(null);

        return licenseRepository.save(license);
    }

    @Transactional
    public License transferLicense(Long id, Long newUserId) {
        revokeLicense(id);
        return assignLicense(id, newUserId);
    }

    @Transactional
    public void deleteLicense(Long id) {
        License license = getLicenseById(id);
        licenseRepository.delete(license);
    }
}
