package com.subtrack.service;

import com.subtrack.model.AuditLog;
import com.subtrack.model.User;
import com.subtrack.repository.AuditLogRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public void log(User user, String action, String entityType, Long entityId, String details, String ipAddress) {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null && user != null) {
            orgId = user.getOrganizationId();
        }

        if (orgId == null) return; // Don't log if no tenant context is available

        AuditLog log = new AuditLog(null, user, action, entityType, entityId, details, ipAddress != null ? ipAddress : "0.0.0.0");
        log.setOrganizationId(orgId);

        auditLogRepository.save(log);
    }
}
