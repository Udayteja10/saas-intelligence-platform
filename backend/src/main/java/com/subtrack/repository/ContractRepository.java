package com.subtrack.repository;

import com.subtrack.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByVendorId(Long vendorId);
    List<Contract> findByExpirationDateBefore(LocalDate date);
    List<Contract> findByExpirationDateBetween(LocalDate start, LocalDate end);
}
