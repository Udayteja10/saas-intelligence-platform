package com.subtrack.controller;

import com.subtrack.model.Organization;
import com.subtrack.model.User;
import com.subtrack.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organization")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Organization> getProfile() {
        return ResponseEntity.ok(organizationService.getProfile());
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<Organization> updateProfile(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(organizationService.updateProfile(payload.get("name")));
    }

    @GetMapping("/members")
    public ResponseEntity<List<User>> getMembers() {
        return ResponseEntity.ok(organizationService.getMembers());
    }

    @PostMapping("/invite")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<User> inviteUser(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(organizationService.inviteUser(
                payload.get("name"),
                payload.get("email"),
                payload.get("role")
        ));
    }

    @PutMapping("/members/{id}/role")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<User> updateMemberRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(organizationService.updateUserRole(id, payload.get("role")));
    }

    @DeleteMapping("/members/{id}")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        organizationService.deleteMember(id);
        return ResponseEntity.ok().build();
    }
}
