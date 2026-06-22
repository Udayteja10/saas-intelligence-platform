package com.subtrack.scheduler;

import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.TenantContext;
import com.subtrack.service.ReportingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class SubTrackScheduler {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BudgetRepository budgetRepository;
    private final ContractRepository contractRepository;
    private final LicenseRepository licenseRepository;
    private final NotificationRepository notificationRepository;
    private final ReportingService reportingService;

    public SubTrackScheduler(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            SubscriptionRepository subscriptionRepository,
            BudgetRepository budgetRepository,
            ContractRepository contractRepository,
            LicenseRepository licenseRepository,
            NotificationRepository notificationRepository,
            ReportingService reportingService) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.budgetRepository = budgetRepository;
        this.contractRepository = contractRepository;
        this.licenseRepository = licenseRepository;
        this.notificationRepository = notificationRepository;
        this.reportingService = reportingService;
    }

    // Runs once a day (represented by a cron or fixedRate in milliseconds)
    // For demonstration, let's configure this to run daily (e.g. cron = "0 0 1 * * ?")
    // But also support triggerable testing.
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void runAllDailyJobs() {
        List<Organization> orgs = organizationRepository.findAll();
        for (Organization org : orgs) {
            try {
                TenantContext.setCurrentTenant(org.getId());
                processTenantJobs(org);
            } catch (Exception e) {
                // Log and continue to prevent one failing organization from crashing the scheduler
                System.err.println("Failed running scheduled jobs for Org: " + org.getName() + ". Error: " + e.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }

    private void processTenantJobs(Organization org) {
        Long orgId = org.getId();
        List<User> users = userRepository.findByOrganizationId(orgId);
        User admin = users.stream().filter(u -> u.getRole() == UserRole.ORG_ADMIN).findFirst().orElse(null);
        if (admin == null) return;

        LocalDate now = LocalDate.now();

        // 1. Renewal Reminders (30, 7, 1 days before)
        List<Subscription> activeSubs = subscriptionRepository.findByStatus("ACTIVE");
        for (Subscription sub : activeSubs) {
            long daysToRenewal = ChronoUnit.DAYS.between(now, sub.getRenewalDate());
            if (daysToRenewal == 30 || daysToRenewal == 7 || daysToRenewal == 1) {
                createAlert(orgId, admin, "RENEWAL", 
                        "Renewal Reminder: " + sub.getName(), 
                        "Subscription " + sub.getName() + " is due for renewal in " + daysToRenewal + " days (Renewal Date: " + sub.getRenewalDate() + "). Cost: $" + sub.getCost());
            }
        }

        // 2. Budget Alerts (used budget > 90% of allocated)
        List<Budget> budgets = budgetRepository.findAll();
        for (Budget b : budgets) {
            BigDecimal threshold = b.getAllocatedAmount().multiply(new BigDecimal("0.90"));
            if (b.getUsedAmount().compareTo(threshold) > 0) {
                createAlert(orgId, admin, "BUDGET", 
                        "Budget Warning: " + b.getDepartment() + " Department", 
                        "The " + b.getDepartment() + " department has utilized over 90% of its allocated budget ($" + b.getAllocatedAmount() + "). Current Spend: $" + b.getUsedAmount());
            }
        }

        // 3. Contract Expiry Checks (expiration within 30 days)
        List<Contract> contracts = contractRepository.findAll();
        for (Contract c : contracts) {
            long daysToExpiry = ChronoUnit.DAYS.between(now, c.getExpirationDate());
            if (daysToExpiry > 0 && daysToExpiry <= 30) {
                createAlert(orgId, admin, "CONTRACT", 
                        "Contract Expiration: " + c.getName(), 
                        "The contract " + c.getName() + " for " + c.getVendor().getName() + " will expire in " + daysToExpiry + " days (Expiry Date: " + c.getExpirationDate() + ").");
            }
        }

        // 4. License Utilization Scans (simulate changing utilization stats or alerting unassigned seats)
        List<License> licenses = licenseRepository.findAll();
        long unusedCount = licenses.stream().filter(l -> "AVAILABLE".equals(l.getStatus())).count();
        if (unusedCount > 0) {
            createAlert(orgId, admin, "LICENSE", 
                    "Unassigned License Seats", 
                    "You currently have " + unusedCount + " unassigned license seats generating cost waste. Revoke or re-allocate them to optimize spending.");
        }
    }

    private void createAlert(Long orgId, User user, String type, String title, String msg) {
        Notification alert = new Notification(null, user, title, msg, type, "UNREAD");
        alert.setOrganizationId(orgId);
        notificationRepository.save(alert);
    }

    // Auto monthly report generation (runs on the 1st of every month at midnight)
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void generateMonthlyScheduledReports() {
        List<Organization> orgs = organizationRepository.findAll();
        for (Organization org : orgs) {
            try {
                TenantContext.setCurrentTenant(org.getId());
                List<User> users = userRepository.findByOrganizationId(org.getId());
                User admin = users.stream().filter(u -> u.getRole() == UserRole.ORG_ADMIN).findFirst().orElse(null);
                Long adminId = admin != null ? admin.getId() : null;

                reportingService.generateReport("MONTHLY_SPEND", "PDF", adminId);
            } catch (IOException e) {
                System.err.println("Failed generating auto report for: " + org.getName());
            } finally {
                TenantContext.clear();
            }
        }
    }
}
