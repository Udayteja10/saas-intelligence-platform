package com.subtrack.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_scores")
public class HealthScore extends BaseTenantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore; // 0-100

    @Column(name = "budget_health", nullable = false)
    private Integer budgetHealth; // 0-100

    @Column(name = "license_health", nullable = false)
    private Integer licenseHealth; // 0-100

    @Column(name = "vendor_health", nullable = false)
    private Integer vendorHealth; // 0-100

    @Column(name = "renewal_health", nullable = false)
    private Integer renewalHealth; // 0-100

    @CreationTimestamp
    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    public HealthScore() {}

    public HealthScore(Long id, Integer overallScore, Integer budgetHealth, Integer licenseHealth, Integer vendorHealth, Integer renewalHealth) {
        this.id = id;
        this.overallScore = overallScore;
        this.budgetHealth = budgetHealth;
        this.licenseHealth = licenseHealth;
        this.vendorHealth = vendorHealth;
        this.renewalHealth = renewalHealth;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public Integer getBudgetHealth() {
        return budgetHealth;
    }

    public void setBudgetHealth(Integer budgetHealth) {
        this.budgetHealth = budgetHealth;
    }

    public Integer getLicenseHealth() {
        return licenseHealth;
    }

    public void setLicenseHealth(Integer licenseHealth) {
        this.licenseHealth = licenseHealth;
    }

    public Integer getVendorHealth() {
        return vendorHealth;
    }

    public void setVendorHealth(Integer vendorHealth) {
        this.vendorHealth = vendorHealth;
    }

    public Integer getRenewalHealth() {
        return renewalHealth;
    }

    public void setRenewalHealth(Integer renewalHealth) {
        this.renewalHealth = renewalHealth;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
