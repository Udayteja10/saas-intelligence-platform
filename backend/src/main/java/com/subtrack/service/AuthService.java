package com.subtrack.service;

import com.subtrack.dto.*;
import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository licenseRepository;
    private final BudgetRepository budgetRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ContractRepository contractRepository;
    private final NotificationRepository notificationRepository;
    private final HealthScoreRepository healthScoreRepository;
    private final ForecastRepository forecastRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            VendorRepository vendorRepository,
            SubscriptionRepository subscriptionRepository,
            LicenseRepository licenseRepository,
            BudgetRepository budgetRepository,
            PurchaseRequestRepository purchaseRequestRepository,
            ContractRepository contractRepository,
            NotificationRepository notificationRepository,
            HealthScoreRepository healthScoreRepository,
            ForecastRepository forecastRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.licenseRepository = licenseRepository;
        this.budgetRepository = budgetRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.contractRepository = contractRepository;
        this.notificationRepository = notificationRepository;
        this.healthScoreRepository = healthScoreRepository;
        this.forecastRepository = forecastRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (organizationRepository.findByName(request.organizationName()).isPresent()) {
            throw new IllegalArgumentException("Organization name already exists");
        }
        if (userRepository.findByEmail(request.adminEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 1. Create Organization
        Organization org = new Organization(null, request.organizationName(), "ACTIVE");
        org = organizationRepository.save(org);

        // 2. Create Org Admin User
        User admin = new User();
        admin.setOrganizationId(org.getId());
        admin.setName(request.adminName());
        admin.setEmail(request.adminEmail());
        admin.setPasswordHash(passwordEncoder.encode(request.password()));
        admin.setRole(UserRole.ORG_ADMIN);
        admin.setStatus("ACTIVE");
        admin = userRepository.save(admin);

        // 3. Seed Mock Workspace Data for this Org
        seedOrganizationData(org, admin);

        // 4. Generate Tokens
        String token = tokenProvider.generateToken(admin.getId(), org.getId(), admin.getRole().name(), admin.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(admin.getId(), org.getId(), admin.getRole().name(), admin.getEmail());

        return new AuthResponse(token, refreshToken, admin.getId(), org.getId(), admin.getName(), admin.getEmail(), admin.getRole().name());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if ("SUSPENDED".equals(user.getStatus())) {
            throw new IllegalArgumentException("User account is suspended");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getOrganizationId(), user.getRole().name(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getOrganizationId(), user.getRole().name(), user.getEmail());

        return new AuthResponse(token, refreshToken, user.getId(), user.getOrganizationId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    @Transactional
    public AuthResponse googleLogin(Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            String token = tokenProvider.generateToken(user.getId(), user.getOrganizationId(), user.getRole().name(), user.getEmail());
            String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getOrganizationId(), user.getRole().name(), user.getEmail());
            return new AuthResponse(token, refreshToken, user.getId(), user.getOrganizationId(), user.getName(), user.getEmail(), user.getRole().name());
        }

        // Register a new organization for this new Google user automatically
        String baseOrgName = name.split(" ")[0] + "'s Org";
        String orgName = baseOrgName;
        int count = 1;
        while (organizationRepository.findByName(orgName).isPresent()) {
            orgName = baseOrgName + " " + count++;
        }

        RegisterRequest regRequest = new RegisterRequest(orgName, name, email, UUID.randomUUID().toString());
        return register(regRequest);
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus("ACTIVE");
            user.setEmailVerificationToken(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setResetPasswordToken(UUID.randomUUID().toString());
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean resetPassword(ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByResetPasswordToken(request.token());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
            user.setResetPasswordToken(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    private void seedOrganizationData(Organization org, User admin) {
        Long orgId = org.getId();
        String orgSlug = org.getName().toLowerCase().replaceAll("[^a-z0-9]", "");

        // 1. Seed other members (Manager and Employee) for work flows
        User manager = new User();
        manager.setOrganizationId(orgId);
        manager.setName("Sarah Manager");
        manager.setEmail("manager@" + orgSlug + ".com");
        manager.setPasswordHash(passwordEncoder.encode("password123"));
        manager.setRole(UserRole.MANAGER);
        manager.setStatus("ACTIVE");
        manager = userRepository.save(manager);

        User employee = new User();
        employee.setOrganizationId(orgId);
        employee.setName("Alex Employee");
        employee.setEmail("employee@" + orgSlug + ".com");
        employee.setPasswordHash(passwordEncoder.encode("password123"));
        employee.setRole(UserRole.EMPLOYEE);
        employee.setStatus("ACTIVE");
        employee = userRepository.save(employee);

        // 2. Seed Vendors
        Vendor microsoft = new Vendor(null, "Microsoft", "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", "Productivity", 20, "microsoft.com", "Office suites and enterprise productivity software.");
        microsoft.setOrganizationId(orgId);
        microsoft = vendorRepository.save(microsoft);

        Vendor google = new Vendor(null, "Google", "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", "Productivity", 15, "google.com", "Workspace, Cloud platform, and developer services.");
        google.setOrganizationId(orgId);
        google = vendorRepository.save(google);

        Vendor aws = new Vendor(null, "AWS", "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", "Cloud", 25, "aws.amazon.com", "Cloud hosting, databases, and compute utilities.");
        aws.setOrganizationId(orgId);
        aws = vendorRepository.save(aws);

        Vendor github = new Vendor(null, "GitHub", "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg", "Development", 10, "github.com", "Code hosting, version control, and CI/CD tools.");
        github.setOrganizationId(orgId);
        github = vendorRepository.save(github);

        Vendor slack = new Vendor(null, "Slack", "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg", "Communication", 30, "slack.com", "Team communication hubs and message channels.");
        slack.setOrganizationId(orgId);
        slack = vendorRepository.save(slack);

        Vendor notion = new Vendor(null, "Notion", "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg", "Productivity", 35, "notion.so", "Wikis, databases, notes, and task management workspace.");
        notion.setOrganizationId(orgId);
        notion = vendorRepository.save(notion);

        // 3. Seed Budgets (Engineering, Finance, Marketing, HR, Operations)
        Budget engBudget = new Budget(null, "Engineering", new BigDecimal("50000.00"), new BigDecimal("42000.00"), LocalDate.now().withDayOfMonth(1), LocalDate.now().plusMonths(6));
        engBudget.setOrganizationId(orgId);
        budgetRepository.save(engBudget);

        Budget mktBudget = new Budget(null, "Marketing", new BigDecimal("10000.00"), new BigDecimal("8200.00"), LocalDate.now().withDayOfMonth(1), LocalDate.now().plusMonths(6));
        mktBudget.setOrganizationId(orgId);
        budgetRepository.save(mktBudget);

        Budget operationsBudget = new Budget(null, "Operations", new BigDecimal("8000.00"), new BigDecimal("2100.00"), LocalDate.now().withDayOfMonth(1), LocalDate.now().plusMonths(6));
        operationsBudget.setOrganizationId(orgId);
        budgetRepository.save(operationsBudget);

        Budget hrBudget = new Budget(null, "HR", new BigDecimal("3000.00"), new BigDecimal("3100.00"), LocalDate.now().withDayOfMonth(1), LocalDate.now().plusMonths(6));
        hrBudget.setOrganizationId(orgId);
        budgetRepository.save(hrBudget);

        // 4. Seed Subscriptions
        Subscription subAws = new Subscription(null, "AWS Core Infrastructure", aws, "Cloud", "Enterprise Tier", new BigDecimal("3200.00"), "USD", "MONTHLY", LocalDate.now().minusMonths(6), LocalDate.now().plusDays(25), "ACTIVE", admin);
        subAws.setOrganizationId(orgId);
        subAws = subscriptionRepository.save(subAws);

        Subscription subGitHub = new Subscription(null, "GitHub Copilot & Hosting", github, "Development", "Enterprise Plan", new BigDecimal("900.00"), "USD", "MONTHLY", LocalDate.now().minusMonths(9), LocalDate.now().plusDays(10), "ACTIVE", admin);
        subGitHub.setOrganizationId(orgId);
        subGitHub = subscriptionRepository.save(subGitHub);

        Subscription subWorkspace = new Subscription(null, "Google Workspace Suite", google, "Productivity", "Business Plus", new BigDecimal("450.00"), "USD", "MONTHLY", LocalDate.now().minusYears(1), LocalDate.now().plusDays(5), "ACTIVE", admin);
        subWorkspace.setOrganizationId(orgId);
        subWorkspace = subscriptionRepository.save(subWorkspace);

        Subscription subSlack = new Subscription(null, "Slack Communication", slack, "Communication", "Pro Tier", new BigDecimal("350.00"), "USD", "MONTHLY", LocalDate.now().minusMonths(4), LocalDate.now().minusDays(2), "ACTIVE", admin);
        subSlack.setOrganizationId(orgId);
        subSlack = subscriptionRepository.save(subSlack);

        Subscription subOffice = new Subscription(null, "Microsoft 365", microsoft, "Productivity", "E5 Plan", new BigDecimal("600.00"), "USD", "MONTHLY", LocalDate.now().minusMonths(12), LocalDate.now().plusMonths(2), "ACTIVE", admin);
        subOffice.setOrganizationId(orgId);
        subOffice = subscriptionRepository.save(subOffice);

        Subscription subNotion = new Subscription(null, "Notion Wiki", notion, "Productivity", "Enterprise Plan", new BigDecimal("180.00"), "USD", "MONTHLY", LocalDate.now().minusMonths(3), LocalDate.now().plusDays(18), "ACTIVE", admin);
        subNotion.setOrganizationId(orgId);
        subNotion = subscriptionRepository.save(subNotion);

        // 5. Seed Licenses for GitHub & Microsoft 365 (to showcase assignments, unused seats, and cost leakage)
        for (int i = 1; i <= 10; i++) {
            User assigned = null;
            String status = "AVAILABLE";
            Integer utilization = 0;
            LocalDateTime lastUsed = null;

            if (i <= 5) {
                assigned = employee;
                status = "ASSIGNED";
                utilization = 80 + i * 3;
                lastUsed = LocalDateTime.now().minusDays(i);
            } else if (i <= 7) {
                assigned = manager;
                status = "ASSIGNED";
                utilization = 5;
                lastUsed = LocalDateTime.now().minusDays(30 + i);
            }

            License lic = new License(null, subGitHub, "GitHub Seat #" + i, assigned, status, new BigDecimal("90.00"), utilization, lastUsed);
            lic.setOrganizationId(orgId);
            licenseRepository.save(lic);
        }

        for (int i = 1; i <= 5; i++) {
            User assigned = null;
            String status = "AVAILABLE";
            Integer utilization = 0;
            LocalDateTime lastUsed = null;

            if (i <= 2) {
                assigned = employee;
                status = "ASSIGNED";
                utilization = 95;
                lastUsed = LocalDateTime.now().minusHours(4);
            } else if (i == 3) {
                assigned = manager;
                status = "ASSIGNED";
                utilization = 0;
                lastUsed = LocalDateTime.now().minusDays(70);
            }

            License lic = new License(null, subOffice, "M365 License " + i, assigned, status, new BigDecimal("120.00"), utilization, lastUsed);
            lic.setOrganizationId(orgId);
            licenseRepository.save(lic);
        }

        // 6. Seed Purchase Requests
        PurchaseRequest req1 = new PurchaseRequest(null, employee, "Figma Pro", "UX styling mockup generation and design library creation.", "Engineering", "HIGH", "PENDING_MANAGER", null, null, null, null, new BigDecimal("45.00"));
        req1.setOrganizationId(orgId);
        purchaseRequestRepository.save(req1);

        PurchaseRequest req2 = new PurchaseRequest(null, manager, "Datadog Enterprise", "APM monitoring, metric alerts, and infrastructure logging.", "Engineering", "MEDIUM", "PENDING_ADMIN", null, null, null, null, new BigDecimal("1200.00"));
        req2.setOrganizationId(orgId);
        purchaseRequestRepository.save(req2);

        // 7. Seed Contracts
        byte[] docBytes = "AWS ENTERPRISE AGREEMENT 2026-2027 CLOUD INFRASTRUCTURE".getBytes();
        Contract contract = new Contract(null, aws, "AWS Master Service Agreement", "aws_enterprise_msa_2026.pdf", docBytes, (long) docBytes.length, "1.0", LocalDate.now().plusMonths(6), "Core AWS computing infrastructure contract negotiated for Acme Corp.");
        contract.setOrganizationId(orgId);
        contractRepository.save(contract);

        // 8. Seed Notifications
        Notification notif1 = new Notification(null, admin, "Renewal Alert: Slack", "The subscription for Slack Communication renewal date of " + LocalDate.now().minusDays(2) + " is overdue.", "RENEWAL", "UNREAD");
        notif1.setOrganizationId(orgId);
        notificationRepository.save(notif1);

        Notification notif2 = new Notification(null, admin, "New Purchase Request", "Alex Employee requested Figma Pro. Needs manager approval.", "APPROVAL", "UNREAD");
        notif2.setOrganizationId(orgId);
        notificationRepository.save(notif2);

        Notification notif3 = new Notification(null, admin, "Department Budget Alert", "The department HR has exceeded its budget allocation ($3,000) by $100.", "BUDGET", "UNREAD");
        notif3.setOrganizationId(orgId);
        notificationRepository.save(notif3);

        // 9. Health Scores
        HealthScore health = new HealthScore(null, 84, 78, 82, 90, 86);
        health.setOrganizationId(orgId);
        healthScoreRepository.save(health);

        // 10. Forecasts
        Forecast f1 = new Forecast(null, "MONTHLY", new BigDecimal("5680.00"), new BigDecimal("6020.80"), new BigDecimal("6.00"));
        f1.setOrganizationId(orgId);
        forecastRepository.save(f1);

        Forecast f2 = new Forecast(null, "ANNUAL", new BigDecimal("68160.00"), new BigDecimal("72249.60"), new BigDecimal("6.00"));
        f2.setOrganizationId(orgId);
        forecastRepository.save(f2);
    }
}
