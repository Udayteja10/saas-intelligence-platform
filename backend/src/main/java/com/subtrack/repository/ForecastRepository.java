package com.subtrack.repository;

import com.subtrack.model.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastRepository extends JpaRepository<Forecast, Long> {
    List<Forecast> findByPeriodOrderByCalculatedAtDesc(String period);
    List<Forecast> findAllByOrderByCalculatedAtDesc();
}
