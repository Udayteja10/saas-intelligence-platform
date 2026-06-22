package com.subtrack.repository;

import com.subtrack.model.HealthScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthScoreRepository extends JpaRepository<HealthScore, Long> {
    List<HealthScore> findAllByOrderByCalculatedAtDesc();
}
