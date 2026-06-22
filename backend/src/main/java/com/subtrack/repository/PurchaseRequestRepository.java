package com.subtrack.repository;

import com.subtrack.model.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    List<PurchaseRequest> findByUserId(Long userId);
    List<PurchaseRequest> findByStatus(String status);
    List<PurchaseRequest> findByDepartment(String department);
}
