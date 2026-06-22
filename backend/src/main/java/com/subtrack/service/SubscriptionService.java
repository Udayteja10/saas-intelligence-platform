package com.subtrack.service;

import com.subtrack.model.Budget;
import com.subtrack.model.Subscription;
import com.subtrack.model.User;
import com.subtrack.model.Vendor;
import com.subtrack.repository.BudgetRepository;
import com.subtrack.repository.SubscriptionRepository;
import com.subtrack.repository.UserRepository;
import com.subtrack.repository.VendorRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;

    public SubscriptionService(
            SubscriptionRepository subscriptionRepository,
            VendorRepository vendorRepository,
            UserRepository userRepository,
            BudgetRepository budgetRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with ID: " + id));
    }

    @Transactional
    public Subscription createSubscription(Subscription sub, Long vendorId, Long ownerId) {
        Long orgId = TenantContext.getCurrentTenant();
        sub.setOrganizationId(orgId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        sub.setVendor(vendor);

        if (ownerId != null) {
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
            sub.setOwner(owner);
        }

        sub.setStatus("ACTIVE");
        Subscription saved = subscriptionRepository.save(sub);
        
        recalculateBudgets();
        return saved;
    }

    @Transactional
    public Subscription updateSubscription(Long id, Subscription updated, Long vendorId, Long ownerId) {
        Subscription existing = getSubscriptionById(id);
        
        existing.setName(updated.getName());
        existing.setCategory(updated.getCategory());
        existing.setPlan(updated.getPlan());
        existing.setCost(updated.getCost());
        existing.setCurrency(updated.getCurrency());
        existing.setBillingCycle(updated.getBillingCycle());
        existing.setStartDate(updated.getStartDate());
        existing.setRenewalDate(updated.getRenewalDate());
        existing.setStatus(updated.getStatus());

        if (vendorId != null) {
            Vendor vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
            existing.setVendor(vendor);
        }

        if (ownerId != null) {
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
            existing.setOwner(owner);
        }

        Subscription saved = subscriptionRepository.save(existing);
        recalculateBudgets();
        return saved;
    }

    @Transactional
    public Subscription cancelSubscription(Long id) {
        Subscription existing = getSubscriptionById(id);
        existing.setStatus("CANCELLED");
        Subscription saved = subscriptionRepository.save(existing);
        recalculateBudgets();
        return saved;
    }

    @Transactional
    public Subscription renewSubscription(Long id, LocalDate newRenewalDate) {
        Subscription existing = getSubscriptionById(id);
        existing.setRenewalDate(newRenewalDate);
        existing.setStatus("ACTIVE");
        Subscription saved = subscriptionRepository.save(existing);
        recalculateBudgets();
        return saved;
    }

    @Transactional
    public void deleteSubscription(Long id) {
        Subscription existing = getSubscriptionById(id);
        subscriptionRepository.delete(existing);
        recalculateBudgets();
    }

    @Transactional
    public void recalculateBudgets() {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) return;

        List<Budget> budgets = budgetRepository.findAll();
        List<Subscription> subscriptions = subscriptionRepository.findByStatus("ACTIVE");

        for (Budget budget : budgets) {
            BigDecimal used = BigDecimal.ZERO;
            for (Subscription sub : subscriptions) {
                String dept = mapCategoryToDepartment(sub.getCategory());
                if (dept.equalsIgnoreCase(budget.getDepartment())) {
                    used = used.add(sub.getCost());
                }
            }
            budget.setUsedAmount(used);
            budgetRepository.save(budget);
        }
    }

    public String mapCategoryToDepartment(String category) {
        if (category == null) return "Operations";
        switch (category.toLowerCase()) {
            case "development":
            case "cloud":
            case "security":
                return "Engineering";
            case "finance":
                return "Finance";
            case "marketing":
                return "Marketing";
            case "hr":
                return "HR";
            case "productivity":
            case "communication":
            case "design":
            default:
                return "Operations";
        }
    }
}
