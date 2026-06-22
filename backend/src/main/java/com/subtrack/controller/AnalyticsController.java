package com.subtrack.controller;

import com.subtrack.model.HealthScore;
import com.subtrack.service.AnalyticsEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsEngineService analyticsEngineService;

    public AnalyticsController(AnalyticsEngineService analyticsEngineService) {
        this.analyticsEngineService = analyticsEngineService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(analyticsEngineService.getDashboardSummary());
    }

    @GetMapping("/health-score")
    public ResponseEntity<HealthScore> getHealthScore() {
        // Recalculates dynamically
        return ResponseEntity.ok(analyticsEngineService.calculateHealthScore());
    }

    @GetMapping("/cost-leaks")
    public ResponseEntity<Map<String, Object>> getCostLeaks() {
        return ResponseEntity.ok(analyticsEngineService.getCostLeaks());
    }

    @GetMapping("/forecast")
    public ResponseEntity<?> getForecast() {
        // Calculates and returns
        return ResponseEntity.ok(analyticsEngineService.calculateForecasts());
    }

    @PostMapping("/calculate")
    public ResponseEntity<String> triggerRecalculation() {
        analyticsEngineService.calculateHealthScore();
        analyticsEngineService.calculateForecasts();
        return ResponseEntity.ok("Calculations completed successfully");
    }
}
