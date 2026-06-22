package com.subtrack.controller;

import com.subtrack.model.Contract;
import com.subtrack.service.ContractService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadContract(@PathVariable Long id) {
        Contract contract = contractService.getContractById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + contract.getFileName() + "\"")
                .body(contract.getFileContent());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<Contract> uploadContract(
            @RequestParam Long vendorId,
            @RequestParam String name,
            @RequestParam(required = false) String version,
            @RequestParam String expirationDate,
            @RequestParam(required = false) String description,
            @RequestPart("file") MultipartFile file) throws IOException {

        LocalDate expDate = LocalDate.parse(expirationDate);
        return ResponseEntity.ok(contractService.uploadContract(
                vendorId,
                name,
                file.getOriginalFilename(),
                file.getBytes(),
                version,
                expDate,
                description
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.ok().build();
    }
}
