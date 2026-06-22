package com.subtrack.controller;

import com.subtrack.model.Report;
import com.subtrack.service.ReportingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportingService reportingService;

    public ReportController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping
    public ResponseEntity<List<Report>> getReports() {
        return ResponseEntity.ok(reportingService.getReportHistory());
    }

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestBody Map<String, String> payload) throws IOException {
        String type = payload.get("type");
        String format = payload.get("format");
        Long createdById = payload.get("createdById") != null ? Long.parseLong(payload.get("createdById")) : null;

        return ResponseEntity.ok(reportingService.generateReport(type, format, createdById));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        Report report = reportingService.getReportById(id);
        
        MediaType mediaType = "PDF".equalsIgnoreCase(report.getFormat()) 
                ? MediaType.APPLICATION_PDF 
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getName() + "\"")
                .body(report.getFileContent());
    }
}
