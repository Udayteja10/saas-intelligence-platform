package com.subtrack.service;

import com.subtrack.model.Contract;
import com.subtrack.model.Vendor;
import com.subtrack.repository.ContractRepository;
import com.subtrack.repository.VendorRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final VendorRepository vendorRepository;

    public ContractService(ContractRepository contractRepository, VendorRepository vendorRepository) {
        this.contractRepository = contractRepository;
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Contract getContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found with ID: " + id));
    }

    @Transactional
    public Contract uploadContract(
            Long vendorId,
            String name,
            String fileName,
            byte[] fileContent,
            String version,
            LocalDate expirationDate,
            String description) throws IOException {

        Long orgId = TenantContext.getCurrentTenant();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        Contract contract = new Contract(null, vendor, name, fileName, fileContent, (long) fileContent.length, version != null ? version : "1.0", expirationDate, description);
        contract.setOrganizationId(orgId);

        return contractRepository.save(contract);
    }

    @Transactional
    public void deleteContract(Long id) {
        Contract contract = getContractById(id);
        contractRepository.delete(contract);
    }
}
