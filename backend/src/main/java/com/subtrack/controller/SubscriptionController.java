package com.subtrack.controller;

import com.subtrack.model.Subscription;
import com.subtrack.service.SubscriptionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<List<Subscription>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subscription> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<Subscription> createSubscription(
            @RequestBody Subscription sub,
            @RequestParam Long vendorId,
            @RequestParam(required = false) Long ownerId) {
        return ResponseEntity.ok(subscriptionService.createSubscription(sub, vendorId, ownerId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<Subscription> updateSubscription(
            @PathVariable Long id,
            @RequestBody Subscription sub,
            @RequestParam Long vendorId,
            @RequestParam(required = false) Long ownerId) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, sub, vendorId, ownerId));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<Subscription> cancelSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(id));
    }

    @PutMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<Subscription> renewSubscription(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        LocalDate newDate = LocalDate.parse(payload.get("renewalDate"));
        return ResponseEntity.ok(subscriptionService.renewSubscription(id, newDate));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<Void> deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
        return ResponseEntity.ok().build();
    }
}
