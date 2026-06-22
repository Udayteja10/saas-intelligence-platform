package com.subtrack.service;

import com.subtrack.model.*;
import com.subtrack.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiAssistantService {

    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository licenseRepository;
    private final BudgetRepository budgetRepository;
    private final VendorRepository vendorRepository;
    private final ContractRepository contractRepository;
    private final AnalyticsEngineService analyticsEngineService;

    public AiAssistantService(
            SubscriptionRepository subscriptionRepository,
            LicenseRepository licenseRepository,
            BudgetRepository budgetRepository,
            VendorRepository vendorRepository,
            ContractRepository contractRepository,
            AnalyticsEngineService analyticsEngineService) {
        this.subscriptionRepository = subscriptionRepository;
        this.licenseRepository = licenseRepository;
        this.budgetRepository = budgetRepository;
        this.vendorRepository = vendorRepository;
        this.contractRepository = contractRepository;
        this.analyticsEngineService = analyticsEngineService;
    }

    @Transactional(readOnly = true)
    public Map<String, String> answerQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Map.of("answer", "Hello! I am your SubTrack AI Assistant. How can I help you manage your SaaS portfolio today?");
        }

        String normalized = query.toLowerCase();
        String answer;

        if (normalized.contains("reduce") || normalized.contains("spending") || normalized.contains("save") || normalized.contains("optimization") || normalized.contains("leak")) {
            answer = handleCostOptimization();
        } else if (normalized.contains("renewal") || normalized.contains("attention") || normalized.contains("overdue")) {
            answer = handleRenewalAnalysis();
        } else if (normalized.contains("unused") || normalized.contains("license") || normalized.contains("underutilized") || normalized.contains("seat")) {
            answer = handleUnusedLicenses();
        } else if (normalized.contains("forecast") || normalized.contains("projection") || normalized.contains("next year")) {
            answer = handleForecastAnalysis();
        } else if (normalized.contains("vendor") || normalized.contains("dependency") || normalized.contains("risk") || normalized.contains("concentration")) {
            answer = handleVendorRiskAnalysis();
        } else if (normalized.contains("health") || normalized.contains("score") || normalized.contains("low") || normalized.contains("maturity")) {
            answer = handleHealthScoreAnalysis();
        } else {
            answer = handleGenericOverview(query);
        }

        return Map.of("answer", answer);
    }

    private String handleCostOptimization() {
        Map<String, Object> leaks = analyticsEngineService.getCostLeaks();
        BigDecimal monthlySavings = (BigDecimal) leaks.get("potentialMonthlySavings");
        BigDecimal annualSavings = (BigDecimal) leaks.get("potentialAnnualSavings");
        List<String> recommendations = (List<String>) leaks.get("recommendations");

        StringBuilder sb = new StringBuilder();
        sb.append("### 💡 Cost Optimization Analysis\n\n");
        sb.append("We scanned your SaaS directory and found potential cost reduction opportunities:\n\n");
        sb.append("- **Potential Monthly Savings:** `$" + monthlySavings + "`\n");
        sb.append("- **Potential Annual Savings:** `$" + annualSavings + "`\n\n");
        
        sb.append("#### Recommended Actions:\n");
        for (String rec : recommendations) {
            sb.append("1. **" + rec + "**\n");
        }

        List<Map<String, Object>> unused = (List<Map<String, Object>>) leaks.get("unusedLicenses");
        if (!unused.isEmpty()) {
            sb.append("\n#### Itemized License Waste:\n");
            sb.append("| License Name | Parent Tool | Assigned To | Monthly Loss |\n");
            sb.append("| :--- | :--- | :--- | :--- |\n");
            for (Map<String, Object> lic : unused) {
                sb.append("| " + lic.get("name") + " | " + lic.get("subscriptionName") + " | " + lic.get("assignedTo") + " | $" + lic.get("monthlyCost") + " |\n");
            }
        }

        return sb.toString();
    }

    private String handleRenewalAnalysis() {
        List<Subscription> active = subscriptionRepository.findByStatus("ACTIVE");
        LocalDate now = LocalDate.now();
        List<Subscription> upcoming = active.stream()
                .filter(s -> s.getRenewalDate().isBefore(now.plusDays(30)))
                .sorted(Comparator.comparing(Subscription::getRenewalDate))
                .collect(Collectors.toList());

        if (upcoming.isEmpty()) {
            return "### 📅 Renewal Analysis\n\nNo active subscriptions require renewal within the next 30 days. Your portfolio is currently up-to-date!";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("### 📅 Renewal Analysis\n\n");
        sb.append("The following active subscriptions require renewal actions or negotiation soon:\n\n");
        sb.append("| Subscription | Vendor | Monthly Cost | Renewal Date | Status | Owner |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- | :--- |\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        for (Subscription sub : upcoming) {
            String status = sub.getRenewalDate().isBefore(now) ? "🔴 OVERDUE" : "🟡 UPCOMING";
            String ownerName = sub.getOwner() != null ? sub.getOwner().getName() : "Unassigned";
            sb.append("| " + sub.getName() + " | " + sub.getVendor().getName() + " | $" + sub.getCost() + " | " + sub.getRenewalDate().format(dtf) + " | " + status + " | " + ownerName + " |\n");
        }

        sb.append("\n**Action Plan:**\n");
        sb.append("- For **OVERDUE** tools, immediately renew or suspend in the Subscriptions page to prevent service interruption.\n");
        sb.append("- Review utilization metrics before approving any renewals to determine if seat numbers can be downsized.");
        return sb.toString();
    }

    private String handleUnusedLicenses() {
        List<License> unused = licenseRepository.findByStatus("AVAILABLE");
        List<License> underutilized = licenseRepository.findAll().stream()
                .filter(l -> "ASSIGNED".equals(l.getStatus()) && l.getUtilizationPercentage() != null && l.getUtilizationPercentage() < 30)
                .collect(Collectors.toList());

        if (unused.isEmpty() && underutilized.isEmpty()) {
            return "### 🎫 License Utilization\n\nAll purchased software seats are currently active and well utilized (>40% frequency). No cost waste found here!";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("### 🎫 License Allocation Report\n\n");
        if (!unused.isEmpty()) {
            sb.append("#### Unassigned seats (Wasteful spend):\n");
            sb.append("| Seat Name | Software Subscription | Unit Cost |\n");
            sb.append("| :--- | :--- | :--- |\n");
            for (License lic : unused) {
                sb.append("| " + lic.getName() + " | " + lic.getSubscription().getName() + " | $" + lic.getCost() + " |\n");
            }
            sb.append("\n");
        }

        if (!underutilized.isEmpty()) {
            sb.append("#### Underutilized seats (Inactive users):\n");
            sb.append("| Seat Name | Software Subscription | Assigned User | Utilization Score |\n");
            sb.append("| :--- | :--- | :--- | :--- |\n");
            for (License lic : underutilized) {
                String userName = lic.getAssignedTo() != null ? lic.getAssignedTo().getName() : "Unknown";
                sb.append("| " + lic.getName() + " | " + lic.getSubscription().getName() + " | " + userName + " | " + lic.getUtilizationPercentage() + "% |\n");
            }
        }

        sb.append("\n**Recommendation:** Re-assign underutilized seats to pending purchase request queues or cancel available capacity on next renewal cycle.");
        return sb.toString();
    }

    private String handleForecastAnalysis() {
        List<Subscription> active = subscriptionRepository.findByStatus("ACTIVE");
        BigDecimal monthlySpend = BigDecimal.ZERO;
        for (Subscription sub : active) {
            if ("ANNUAL".equalsIgnoreCase(sub.getBillingCycle())) {
                monthlySpend = monthlySpend.add(sub.getCost().divide(new BigDecimal("12.00"), 2, RoundingMode.HALF_UP));
            } else {
                monthlySpend = monthlySpend.add(sub.getCost());
            }
        }

        BigDecimal annualSpend = monthlySpend.multiply(new BigDecimal("12.00"));
        BigDecimal growthMultiplier = new BigDecimal("1.06");
        BigDecimal projectedAnnual = annualSpend.multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP);

        StringBuilder sb = new StringBuilder();
        sb.append("### 🔮 Spend Forecast Model\n\n");
        sb.append("Based on current active subscriptions, here is the cash flow projection:\n\n");
        sb.append("- **Current Monthly Burn Rate:** `$" + monthlySpend.setScale(2, RoundingMode.HALF_UP) + "`\n");
        sb.append("- **Current Annual Run Rate:** `$" + annualSpend.setScale(2, RoundingMode.HALF_UP) + "`\n");
        sb.append("- **Projected Annual Spend (with 6% Growth Trend):** `$" + projectedAnnual + "`\n\n");
        
        sb.append("#### Period Breakdown:\n");
        sb.append("| Interval | Current Run Rate | Projected (with growth) | Growth Percentage |\n");
        sb.append("| :--- | :--- | :--- | :--- |\n");
        sb.append("| Monthly | $" + monthlySpend.setScale(2, RoundingMode.HALF_UP) + " | $" + monthlySpend.multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP) + " | 6.0% |\n");
        sb.append("| Quarterly | $" + monthlySpend.multiply(new BigDecimal("3.00")).setScale(2, RoundingMode.HALF_UP) + " | $" + monthlySpend.multiply(new BigDecimal("3.00")).multiply(growthMultiplier).setScale(2, RoundingMode.HALF_UP) + " | 6.0% |\n");
        sb.append("| Annual | $" + annualSpend.setScale(2, RoundingMode.HALF_UP) + " | $" + projectedAnnual + " | 6.0% |\n");

        return sb.toString();
    }

    private String handleVendorRiskAnalysis() {
        List<Subscription> active = subscriptionRepository.findByStatus("ACTIVE");
        BigDecimal totalSpend = BigDecimal.ZERO;
        Map<String, BigDecimal> vendorSpends = new HashMap<>();
        Map<String, Integer> vendorRisks = new HashMap<>();

        for (Subscription sub : active) {
            BigDecimal subCost = sub.getCost();
            if ("ANNUAL".equalsIgnoreCase(sub.getBillingCycle())) {
                subCost = subCost.divide(new BigDecimal("12.00"), 2, RoundingMode.HALF_UP);
            }
            totalSpend = totalSpend.add(subCost);
            String vendorName = sub.getVendor().getName();
            vendorSpends.put(vendorName, vendorSpends.getOrDefault(vendorName, BigDecimal.ZERO).add(subCost));
            vendorRisks.put(vendorName, sub.getVendor().getRiskScore());
        }

        if (totalSpend.compareTo(BigDecimal.ZERO) == 0) {
            return "### ⚠️ Vendor Risk & Dependency\n\nNo active subscriptions available to calculate dependencies.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("### ⚠️ Vendor Concentration & Risk Report\n\n");
        sb.append("We evaluated vendor risk scores and monthly spend allocations:\n\n");
        sb.append("| Vendor Name | Risk Rating (1-100) | Monthly Cost | Cost Share (%) |\n");
        sb.append("| :--- | :--- | :--- | :--- |\n");

        for (Map.Entry<String, BigDecimal> entry : vendorSpends.entrySet()) {
            String vName = entry.getKey();
            BigDecimal cost = entry.getValue();
            BigDecimal pct = cost.multiply(new BigDecimal("100")).divide(totalSpend, 2, RoundingMode.HALF_UP);
            Integer risk = vendorRisks.get(vName);
            String riskBadge = risk > 30 ? "🟠 Medium-High" : "🟢 Low";
            sb.append("| " + vName + " | " + riskBadge + " (" + risk + ") | $" + cost + " | " + pct + "% |\n");
        }

        // Concentration Alert
        for (Map.Entry<String, BigDecimal> entry : vendorSpends.entrySet()) {
            BigDecimal pct = entry.getValue().multiply(new BigDecimal("100")).divide(totalSpend, 2, RoundingMode.HALF_UP);
            if (pct.compareTo(new BigDecimal("50")) > 0) {
                sb.append("\n⚠️ **High Vendor Concentration Alert:** **" + entry.getKey() + "** accounts for " + pct + "% of your overall software spend. Consider diversified provider backups to minimize lock-in risks.");
            }
        }

        return sb.toString();
    }

    private String handleHealthScoreAnalysis() {
        HealthScore score = analyticsEngineService.calculateHealthScore();

        StringBuilder sb = new StringBuilder();
        sb.append("### 📊 SaaS Health Score & Maturity Breakdown\n\n");
        sb.append("Your organization has a SaaS maturity rating of **" + score.getOverallScore() + "/100**.\n\n");
        
        sb.append("#### Health Subscores:\n");
        sb.append("- 💼 **Budget Health:** `" + score.getBudgetHealth() + "/100`\n");
        sb.append("- 🎫 **License Utilization Health:** `" + score.getLicenseHealth() + "/100`\n");
        sb.append("- 🤝 **Vendor Diversity:** `" + score.getVendorHealth() + "/100`\n");
        sb.append("- 📅 **Renewal Readiness:** `" + score.getRenewalHealth() + "/100`\n\n");

        sb.append("#### Analysis:\n");
        if (score.getBudgetHealth() < 80) {
            sb.append("- Your budget health is down because department budgets are close to or exceeding limits. Investigate HR/Engineering allocations.\n");
        }
        if (score.getLicenseHealth() < 80) {
            sb.append("- License health is impacted by low seat usage or unallocated licenses. Review GitHub or Microsoft allocations.\n");
        }
        if (score.getRenewalHealth() < 80) {
            sb.append("- Renewal readiness is low due to overdue subscriptions. Clean up inactive items.\n");
        }
        if (score.getOverallScore() >= 80) {
            sb.append("✅ **Overall Status:** Your SaaS administration is highly mature. Continue automated scanning to protect cost control.");
        } else {
            sb.append("⚠️ **Overall Status:** Needs attention. Focus on cleaning up unused seats and consolidating redundant applications.");
        }

        return sb.toString();
    }

    private String handleGenericOverview(String userQuery) {
        Map<String, Object> summary = analyticsEngineService.getDashboardSummary();
        return "### 👋 Hello! I am your SubTrack AI Assistant.\n\n" +
                "I have scanned your organization directory. Here is your portfolio overview:\n\n" +
                "- **Monthly Burn Rate:** $" + summary.get("monthlySpend") + "\n" +
                "- **Active Tools:** " + summary.get("activeSubscriptions") + "\n" +
                "- **Total Licenses:** " + summary.get("totalLicenses") + " seats\n" +
                "- **Potential Monthly Savings:** $" + summary.get("potentialMonthlySavings") + "\n\n" +
                "You can ask me specific questions for analytical deep dives, such as:\n" +
                "1. *How can we reduce software spending?*\n" +
                "2. *Which renewals require attention?*\n" +
                "3. *Show unused licenses.*\n" +
                "4. *Forecast next year's spend.*\n" +
                "5. *Analyze vendor dependency.*\n" +
                "6. *Why is our SaaS Health Score low?*";
    }
}
