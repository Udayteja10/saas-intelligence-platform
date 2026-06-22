package com.subtrack.controller;

import com.subtrack.model.PurchaseRequest;
import com.subtrack.service.PurchaseRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    @GetMapping
    public ResponseEntity<List<PurchaseRequest>> getAllRequests() {
        return ResponseEntity.ok(purchaseRequestService.getAllRequests());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PurchaseRequest>> getRequestsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(purchaseRequestService.getRequestsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequest> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseRequestService.getRequestById(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseRequest> createRequest(
            @RequestBody PurchaseRequest request,
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(purchaseRequestService.createRequest(request, employeeId));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<PurchaseRequest> approveRequest(
            @PathVariable Long id,
            @RequestParam Long approverId,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(purchaseRequestService.approveRequest(id, approverId, payload.get("comment")));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<PurchaseRequest> rejectRequest(
            @PathVariable Long id,
            @RequestParam Long rejecterId,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(purchaseRequestService.rejectRequest(id, rejecterId, payload.get("comment")));
    }
}
