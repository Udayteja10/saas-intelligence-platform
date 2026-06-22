package com.subtrack.service;

import com.subtrack.model.Vendor;
import com.subtrack.repository.VendorRepository;
import com.subtrack.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Vendor getVendorById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with ID: " + id));
    }

    @Transactional
    public Vendor createVendor(Vendor vendor) {
        Long orgId = TenantContext.getCurrentTenant();
        vendor.setOrganizationId(orgId);
        if (vendor.getRiskScore() == null) {
            vendor.setRiskScore(20); // Default low-to-medium risk
        }
        return vendorRepository.save(vendor);
    }

    @Transactional
    public Vendor updateVendor(Long id, Vendor updated) {
        Vendor existing = getVendorById(id);
        existing.setName(updated.getName());
        existing.setLogoUrl(updated.getLogoUrl());
        existing.setCategory(updated.getCategory());
        existing.setRiskScore(updated.getRiskScore());
        existing.setWebsite(updated.getWebsite());
        existing.setDescription(updated.getDescription());
        return vendorRepository.save(existing);
    }

    @Transactional
    public void deleteVendor(Long id) {
        Vendor existing = getVendorById(id);
        vendorRepository.delete(existing);
    }
}
