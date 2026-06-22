package com.subtrack.repository;

import com.subtrack.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByStatus(String status);
    List<Subscription> findByRenewalDateBetween(LocalDate start, LocalDate end);
    List<Subscription> findByRenewalDateBeforeAndStatus(LocalDate date, String status);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE'")
    List<Subscription> findAllActive();
}
