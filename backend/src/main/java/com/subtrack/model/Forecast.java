package com.subtrack.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecasts")
public class Forecast extends BaseTenantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String period; // MONTHLY, QUARTERLY, ANNUAL

    @Column(name = "current_spend", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentSpend;

    @Column(name = "projected_spend", nullable = false, precision = 10, scale = 2)
    private BigDecimal projectedSpend;

    @Column(name = "growth_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal growthPercentage;

    @CreationTimestamp
    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    public Forecast() {}

    public Forecast(Long id, String period, BigDecimal currentSpend, BigDecimal projectedSpend, BigDecimal growthPercentage) {
        this.id = id;
        this.period = period;
        this.currentSpend = currentSpend;
        this.projectedSpend = projectedSpend;
        this.growthPercentage = growthPercentage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public BigDecimal getCurrentSpend() {
        return currentSpend;
    }

    public void setCurrentSpend(BigDecimal currentSpend) {
        this.currentSpend = currentSpend;
    }

    public BigDecimal getProjectedSpend() {
        return projectedSpend;
    }

    public void setProjectedSpend(BigDecimal projectedSpend) {
        this.projectedSpend = projectedSpend;
    }

    public BigDecimal getGrowthPercentage() {
        return growthPercentage;
    }

    public void setGrowthPercentage(BigDecimal growthPercentage) {
        this.growthPercentage = growthPercentage;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
