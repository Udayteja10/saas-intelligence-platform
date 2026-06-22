package com.subtrack.service;

import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public PurchaseRequestService(
            PurchaseRequestRepository purchaseRequestRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequest> getAllRequests() {
        return purchaseRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequest> getRequestsByUser(Long userId) {
        return purchaseRequestRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public PurchaseRequest getRequestById(Long id) {
        return purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase request not found with ID: " + id));
    }

    @Transactional
    public PurchaseRequest createRequest(PurchaseRequest request, Long employeeId) {
        Long orgId = TenantContext.getCurrentTenant();
        request.setOrganizationId(orgId);

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        request.setUser(employee);
        request.setStatus("PENDING_MANAGER");

        PurchaseRequest saved = purchaseRequestRepository.save(request);

        // Send alert to org managers
        sendNotificationToRole(orgId, UserRole.MANAGER, "New Approval Request", 
                employee.getName() + " has requested " + request.getSoftwareName() + ".");

        return saved;
    }

    @Transactional
    public PurchaseRequest approveRequest(Long id, Long approverId, String comment) {
        Long orgId = TenantContext.getCurrentTenant();
        PurchaseRequest request = getRequestById(id);
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found"));

        if ("PENDING_MANAGER".equals(request.getStatus())) {
            if (approver.getRole() != UserRole.MANAGER && approver.getRole() != UserRole.ORG_ADMIN) {
                throw new SecurityException("Only managers can perform manager approval");
            }
            request.setManager(approver);
            request.setManagerComment(comment);
            request.setStatus("PENDING_ADMIN");

            // Notify admin
            sendNotificationToRole(orgId, UserRole.ORG_ADMIN, "Admin Approval Needed", 
                    "Manager approved procurement of " + request.getSoftwareName() + ". Awaiting final admin approval.");

        } else if ("PENDING_ADMIN".equals(request.getStatus())) {
            if (approver.getRole() != UserRole.ORG_ADMIN) {
                throw new SecurityException("Only administrators can perform final approval");
            }
            request.setAdmin(approver);
            request.setAdminComment(comment);
            request.setStatus("APPROVED");

            // Notify employee
            sendNotificationToUser(orgId, request.getUser(), "Software Request Approved", 
                    "Your request for " + request.getSoftwareName() + " has been approved!");
        } else {
            throw new IllegalArgumentException("Cannot approve a request with status: " + request.getStatus());
        }

        return purchaseRequestRepository.save(request);
    }

    @Transactional
    public PurchaseRequest rejectRequest(Long id, Long rejecterId, String comment) {
        Long orgId = TenantContext.getCurrentTenant();
        PurchaseRequest request = getRequestById(id);
        User rejecter = userRepository.findById(rejecterId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!"PENDING_MANAGER".equals(request.getStatus()) && !"PENDING_ADMIN".equals(request.getStatus())) {
            throw new IllegalArgumentException("Cannot reject a request with status: " + request.getStatus());
        }

        if ("PENDING_MANAGER".equals(request.getStatus())) {
            request.setManager(rejecter);
            request.setManagerComment(comment);
        } else {
            request.setAdmin(rejecter);
            request.setAdminComment(comment);
        }

        request.setStatus("REJECTED");
        PurchaseRequest saved = purchaseRequestRepository.save(request);

        // Notify employee
        sendNotificationToUser(orgId, request.getUser(), "Software Request Rejected", 
                "Your request for " + request.getSoftwareName() + " was rejected. Reason: " + comment);

        return saved;
    }

    private void sendNotificationToRole(Long orgId, UserRole role, String title, String msg) {
        List<User> users = userRepository.findByOrganizationId(orgId);
        for (User u : users) {
            if (u.getRole() == role) {
                Notification notif = new Notification(null, u, title, msg, "APPROVAL", "UNREAD");
                notif.setOrganizationId(orgId);
                notificationRepository.save(notif);
            }
        }
    }

    private void sendNotificationToUser(Long orgId, User user, String title, String msg) {
        Notification notif = new Notification(null, user, title, msg, "APPROVAL", "UNREAD");
        notif.setOrganizationId(orgId);
        notificationRepository.save(notif);
    }
}
