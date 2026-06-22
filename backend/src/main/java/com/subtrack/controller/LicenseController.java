package com.subtrack.controller;

import com.subtrack.model.License;
import com.subtrack.service.LicenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/licenses")
public class LicenseController {

    private final LicenseService licenseService;

    public LicenseController(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    @GetMapping
    public ResponseEntity<List<License>> getAllLicenses() {
        return ResponseEntity.ok(licenseService.getAllLicenses());
    }

    @GetMapping("/subscription/{subId}")
    public ResponseEntity<List<License>> getLicensesBySubscription(@PathVariable Long subId) {
        return ResponseEntity.ok(licenseService.getLicensesBySubscription(subId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<License> getLicenseById(@PathVariable Long id) {
        return ResponseEntity.ok(licenseService.getLicenseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<License> createLicense(@RequestBody License license, @RequestParam Long subscriptionId) {
        return ResponseEntity.ok(licenseService.createLicense(license, subscriptionId));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<License> assignLicense(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        return ResponseEntity.ok(licenseService.assignLicense(id, payload.get("userId")));
    }

    @PutMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<License> revokeLicense(@PathVariable Long id) {
        return ResponseEntity.ok(licenseService.revokeLicense(id));
    }

    @PutMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<License> transferLicense(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        return ResponseEntity.ok(licenseService.transferLicense(id, payload.get("userId")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<Void> deleteLicense(@PathVariable Long id) {
        licenseService.deleteLicense(id);
        return ResponseEntity.ok().build();
    }
}
