package com.subtrack.service;

import com.subtrack.model.Budget;
import com.subtrack.repository.BudgetRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Budget getBudgetById(Long id) {
        return budgetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found with ID: " + id));
    }

    @Transactional
    public Budget createBudget(Budget budget) {
        Long orgId = TenantContext.getCurrentTenant();
        budget.setOrganizationId(orgId);
        if (budget.getUsedAmount() == null) {
            budget.setUsedAmount(BigDecimal.ZERO);
        }
        return budgetRepository.save(budget);
    }

    @Transactional
    public Budget updateBudget(Long id, Budget updated) {
        Budget existing = getBudgetById(id);
        existing.setAllocatedAmount(updated.getAllocatedAmount());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        return budgetRepository.save(existing);
    }

    @Transactional
    public void deleteBudget(Long id) {
        Budget budget = getBudgetById(id);
        budgetRepository.delete(budget);
    }
}
