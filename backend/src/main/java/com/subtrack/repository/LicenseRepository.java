package com.subtrack.repository;

import com.subtrack.model.License;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LicenseRepository extends JpaRepository<License, Long> {
    List<License> findBySubscriptionId(Long subscriptionId);
    List<License> findByStatus(String status);
    List<License> findByAssignedToIsNull();
    List<License> findByAssignedToId(Long userId);
}
