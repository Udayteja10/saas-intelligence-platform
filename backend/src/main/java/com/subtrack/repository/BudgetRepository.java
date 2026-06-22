package com.subtrack.repository;

import com.subtrack.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByDepartment(String department);
    Optional<Budget> findByDepartmentAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            String department, LocalDate start, LocalDate end);
}
