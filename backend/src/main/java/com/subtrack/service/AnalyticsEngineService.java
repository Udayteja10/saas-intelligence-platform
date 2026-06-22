package com.subtrack.service;

import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AnalyticsEngineService {

    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository licenseRepository;
    private final BudgetRepository budgetRepository;
    private final VendorRepository vendorRepository;
    private final ContractRepository contractRepository;
    private final HealthScoreRepository healthScoreRepository;
    private final ForecastRepository forecastRepository;

    public AnalyticsEngineService(
            SubscriptionRepository subscriptionRepository,
            LicenseRepository licenseRepository,
            BudgetRepository budgetRepository,
            VendorRepository vendorRepository,
            ContractRepository contractRepository,
            HealthScoreRepository healthScoreRepository,
            ForecastRepository forecastRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.licenseRepository = licenseRepository;
        this.budgetRepository = budgetRepository;
        this.vendorRepository = vendorRepository;
        this.contractRepository = contractRepository;
        this.healthScoreRepository = healthScoreRepository;
        this.forecastRepository = forecastRepository;
    }

    @Transactional
    public HealthScore calculateHealthScore() {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");

        // 1. Budget Health
        List<Budget> budgets = budgetRepository.findAll();
        int overBudgetDepts = 0;
        for (Budget b : budgets) {
            if (b.getUsedAmount().compareTo(b.getAllocatedAmount()) > 0) {
                overBudgetDepts++;
            }
        }
        int budgetHealth = budgets.isEmpty() ? 100 : Math.max(0, 100 - (overBudgetDepts * 100 / budgets.size()));

        // 2. License Health (Utilization)
        List<License> licenses = licenseRepository.findAll();
        int totalAssigned = 0;
        int activeLicenses = 0;
        for (License lic : licenses) {
            if ("ASSIGNED".equals(lic.getStatus())) {
                totalAssigned++;
                if (lic.getUtilizationPercentage() != null && lic.getUtilizationPercentage() >= 40) {
                    activeLicenses++;
                }
            }
        }
        int licenseHealth = totalAssigned == 0 ? 100 : (activeLicenses * 100 / totalAssigned);

        // 3. Vendor Health (Concentration and Diversity)
        List<Vendor> vendors = vendorRepository.findAll();
        int vendorHealth = Math.min(100, Math.max(20, vendors.size() * 15)); // Good mix = >6 vendors

        // 4. Renewal Health (Averting overdue renewals)
        List<Subscription> subscriptions = subscriptionRepository.findAllActive();
        int overdueCount = 0;
        for (Subscription sub : subscriptions) {
            if (sub.getRenewalDate().isBefore(LocalDate.now())) {
                overdueCount++;
            }
        }
        int renewalHealth = subscriptions.isEmpty() ? 100 : Math.max(0, 100 - (overdueCount * 25));

        int overall = (budgetHealth + licenseHealth + vendorHealth + renewalHealth) / 4;

        HealthScore score = new HealthScore(null, overall, budgetHealth, licenseHealth, vendorHealth, renewalHealth);
        score.setOrganizationId(orgId);

        return healthScoreRepository.save(score);
    }

    @Transactional
    public List<Forecast> calculateForecasts() {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");

        List<Subscription> activeSubs = subscriptionRepository.findByStatus("ACTIVE");
        BigDecimal monthlySpend = BigDecimal.ZERO;

        for (Subscription sub : activeSubs) {
            if ("ANNUAL".equalsIgnoreCase(sub.getBillingCycle())) {
                monthlySpend = monthlySpend.add(sub.getCost().divide(new BigDecimal("12.00"), 2, RoundingMode.HALF_UP));
            } else {
                monthlySpend = monthlySpend.add(sub.getCost());
            }
        }

        BigDecimal annualSpend = monthlySpend.multiply(new BigDecimal("12.00"));
        BigDecimal quarterlySpend = monthlySpend.multiply(new BigDecimal("3.00"));

        // Growth factor assumption (6% average growth)
        BigDecimal growth = new BigDecimal("6.00");
        BigDecimal growthMultiplier = new BigDecimal("1.06");

        Forecast mForecast = new Forecast(null, "MONTHLY", monthlySpend, monthlySpend.multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP), growth);
        mForecast.setOrganizationId(orgId);

        Forecast qForecast = new Forecast(null, "QUARTERLY", quarterlySpend, quarterlySpend.multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP), growth);
        qForecast.setOrganizationId(orgId);

        Forecast aForecast = new Forecast(null, "ANNUAL", annualSpend, annualSpend.multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP), growth);
        aForecast.setOrganizationId(orgId);

        forecastRepository.save(mForecast);
        forecastRepository.save(qForecast);
        return List.of(forecastRepository.save(aForecast), mForecast, qForecast);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCostLeaks() {
        // 1. Unused Licenses
        List<License> licenses = licenseRepository.findAll();
        List<Map<String, Object>> unusedList = new ArrayList<>();
        BigDecimal totalMonthlySavings = BigDecimal.ZERO;

        for (License lic : licenses) {
            boolean isUnused = "AVAILABLE".equals(lic.getStatus()) || 
                               lic.getAssignedTo() == null || 
                               (lic.getUtilizationPercentage() != null && lic.getUtilizationPercentage() < 10) ||
                               (lic.getLastUsedAt() != null && ChronoUnit.DAYS.between(lic.getLastUsedAt(), LocalDateTime.now()) > 30);
            
            if (isUnused) {
                BigDecimal monthlyCost = lic.getCost();
                if (lic.getSubscription() != null && "ANNUAL".equalsIgnoreCase(lic.getSubscription().getBillingCycle())) {
                    monthlyCost = monthlyCost.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
                }

                unusedList.add(Map.of(
                        "licenseId", lic.getId(),
                        "name", lic.getName(),
                        "subscriptionName", lic.getSubscription() != null ? lic.getSubscription().getName() : "Unknown",
                        "assignedTo", lic.getAssignedTo() != null ? lic.getAssignedTo().getName() : "Unassigned",
                        "utilization", lic.getUtilizationPercentage() != null ? lic.getUtilizationPercentage() : 0,
                        "monthlyCost", monthlyCost
                ));
                totalMonthlySavings = totalMonthlySavings.add(monthlyCost);
            }
        }

        // 2. Duplicate Subscriptions in same category
        List<Subscription> activeSubs = subscriptionRepository.findByStatus("ACTIVE");
        Map<String, List<Subscription>> categoryMap = new HashMap<>();
        for (Subscription sub : activeSubs) {
            categoryMap.computeIfAbsent(sub.getCategory(), k -> new ArrayList<>()).add(sub);
        }

        List<Map<String, Object>> duplicateRecs = new ArrayList<>();
        for (Map.Entry<String, List<Subscription>> entry : categoryMap.entrySet()) {
            if (entry.getValue().size() > 1) {
                List<Subscription> subs = entry.getValue();
                StringBuilder names = new StringBuilder();
                BigDecimal totalCatCost = BigDecimal.ZERO;
                for (Subscription s : subs) {
                    if (names.length() > 0) names.append(", ");
                    names.append(s.getName());
                    totalCatCost = totalCatCost.add(s.getCost());
                }
                duplicateRecs.add(Map.of(
                        "category", entry.getKey(),
                        "subscriptions", names.toString(),
                        "count", subs.size(),
                        "recommendation", "Consider consolidation. You have " + subs.size() + " separate active tools in " + entry.getKey() + " category (" + names + ")."
                ));
            }
        }

        // 3. Overspending Departments
        List<Budget> budgets = budgetRepository.findAll();
        List<Map<String, Object>> overspentBudgets = new ArrayList<>();
        for (Budget b : budgets) {
            if (b.getUsedAmount().compareTo(b.getAllocatedAmount()) > 0) {
                BigDecimal excess = b.getUsedAmount().subtract(b.getAllocatedAmount());
                overspentBudgets.add(Map.of(
                        "department", b.getDepartment(),
                        "allocated", b.getAllocatedAmount(),
                        "used", b.getUsedAmount(),
                        "overspentAmount", excess,
                        "percentUsed", b.getUsedAmount().multiply(new BigDecimal("100")).divide(b.getAllocatedAmount(), 2, RoundingMode.HALF_UP)
                ));
            }
        }

        // Actionable Recommendations
        List<String> recommendations = new ArrayList<>();
        if (!unusedList.isEmpty()) {
            recommendations.add("Revoke and de-provision " + unusedList.size() + " unused/underutilized license seats to save up to $" + totalMonthlySavings.setScale(2, RoundingMode.HALF_UP) + "/mo.");
        }
        if (!duplicateRecs.isEmpty()) {
            recommendations.add("Consolidate overlapping productivity/collaboration tools in category distribution to eliminate duplicate software packages.");
        }
        if (!overspentBudgets.isEmpty()) {
            for (Map<String, Object> ob : overspentBudgets) {
                recommendations.add("The " + ob.get("department") + " department is over budget by $" + ob.get("overspentAmount") + ". Freeze non-critical renewals.");
            }
        }
        if (recommendations.isEmpty()) {
            recommendations.add("No critical cost leaks detected! Continue maintaining active usage reviews.");
        }

        return Map.of(
                "unusedLicenses", unusedList,
                "duplicates", duplicateRecs,
                "overspentDepartments", overspentBudgets,
                "potentialMonthlySavings", totalMonthlySavings.setScale(2, RoundingMode.HALF_UP),
                "potentialAnnualSavings", totalMonthlySavings.multiply(new BigDecimal("12")).setScale(2, RoundingMode.HALF_UP),
                "recommendations", recommendations
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary() {
        List<Subscription> active = subscriptionRepository.findByStatus("ACTIVE");
        BigDecimal monthlySpend = BigDecimal.ZERO;
        for (Subscription sub : active) {
            if ("ANNUAL".equalsIgnoreCase(sub.getBillingCycle())) {
                monthlySpend = monthlySpend.add(sub.getCost().divide(new BigDecimal("12.00"), 2, RoundingMode.HALF_UP));
            } else {
                monthlySpend = monthlySpend.add(sub.getCost());
            }
        }

        List<HealthScore> hsList = healthScoreRepository.findAllByOrderByCalculatedAtDesc();
        Integer currentHs = hsList.isEmpty() ? 80 : hsList.get(0).getOverallScore();

        List<License> licenses = licenseRepository.findAll();
        long totalLics = licenses.size();
        long assignedLics = licenses.stream().filter(l -> "ASSIGNED".equals(l.getStatus())).count();
        double utilization = totalLics == 0 ? 0.0 : ((double) assignedLics / totalLics) * 100.0;

        List<Subscription> renewals = subscriptionRepository.findByRenewalDateBetween(LocalDate.now(), LocalDate.now().plusDays(30));
        Map<String, Object> leakSummary = getCostLeaks();

        Map<String, Object> summary = new HashMap<>();
        summary.put("monthlySpend", monthlySpend.setScale(2, RoundingMode.HALF_UP));
        summary.put("annualSpend", monthlySpend.multiply(new BigDecimal("12")).setScale(2, RoundingMode.HALF_UP));
        summary.put("activeSubscriptions", active.size());
        summary.put("upcomingRenewalsCount", renewals.size());
        summary.put("totalLicenses", totalLics);
        summary.put("assignedLicenses", assignedLics);
        summary.put("licenseUtilizationPercentage", Math.round(utilization));
        summary.put("saasHealthScore", currentHs);
        summary.put("potentialMonthlySavings", leakSummary.get("potentialMonthlySavings"));
        summary.put("potentialAnnualSavings", leakSummary.get("potentialAnnualSavings"));
        summary.put("vendorCount", vendorRepository.count());

        return summary;
    }
}
