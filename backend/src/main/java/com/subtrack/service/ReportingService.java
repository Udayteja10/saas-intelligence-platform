package com.subtrack.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.subtrack.model.*;
import com.subtrack.repository.*;
import com.subtrack.security.TenantContext;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportingService {

    private final ReportRepository reportRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository licenseRepository;
    private final BudgetRepository budgetRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final AnalyticsEngineService analyticsEngineService;

    public ReportingService(
            ReportRepository reportRepository,
            SubscriptionRepository subscriptionRepository,
            LicenseRepository licenseRepository,
            BudgetRepository budgetRepository,
            VendorRepository vendorRepository,
            UserRepository userRepository,
            AnalyticsEngineService analyticsEngineService) {
        this.reportRepository = reportRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.licenseRepository = licenseRepository;
        this.budgetRepository = budgetRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.analyticsEngineService = analyticsEngineService;
    }

    @Transactional(readOnly = true)
    public List<Report> getReportHistory() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Report getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + id));
    }

    @Transactional
    public Report generateReport(String type, String format, Long createdById) throws IOException {
        Long orgId = TenantContext.getCurrentTenant();
        if (orgId == null) throw new IllegalArgumentException("Tenant context not set");

        User creator = null;
        if (createdById != null) {
            creator = userRepository.findById(createdById).orElse(null);
        }

        byte[] content;
        if ("PDF".equalsIgnoreCase(format)) {
            content = generatePdf(type);
        } else {
            content = generateExcel(type);
        }

        String name = type.replace("_", " ") + " - " + LocalDate.now().toString() + "." + format.toLowerCase();

        Report report = new Report(null, name, type, format.toUpperCase(), content, creator);
        report.setOrganizationId(orgId);

        return reportRepository.save(report);
    }

    private byte[] generatePdf(String type) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldBody = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

            // Title
            Paragraph title = new Paragraph("SubTrack AI - " + type.replace("_", " ") + " Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Metadata block
            Paragraph meta = new Paragraph("Generated on: " + LocalDate.now() + " | Organization Context ID: " + TenantContext.getCurrentTenant(), bodyFont);
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(20);
            document.add(meta);

            // Conditional Data Table
            if ("MONTHLY_SPEND".equals(type) || "ANNUAL_SPEND".equals(type)) {
                List<Subscription> subs = subscriptionRepository.findByStatus("ACTIVE");
                PdfPTable table = new PdfPTable(5);
                table.setWidthPercentage(100);
                
                String[] headers = {"Subscription", "Vendor", "Billing Cycle", "Renewal Date", "Cost"};
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                    cell.setBackgroundColor(new Color(63, 81, 181)); // Slate Blue
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    table.addCell(cell);
                }

                BigDecimal total = BigDecimal.ZERO;
                for (Subscription s : subs) {
                    table.addCell(new PdfPCell(new Phrase(s.getName(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase(s.getVendor().getName(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase(s.getBillingCycle(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase(s.getRenewalDate().toString(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase("$" + s.getCost(), bodyFont)));
                    total = total.add(s.getCost());
                }

                document.add(table);

                Paragraph totalText = new Paragraph("\nTotal Sum Cost of Subscriptions: $" + total.setScale(2), boldBody);
                totalText.setAlignment(Element.ALIGN_RIGHT);
                document.add(totalText);

            } else if ("BUDGET_UTILIZATION".equals(type)) {
                List<Budget> budgets = budgetRepository.findAll();
                PdfPTable table = new PdfPTable(4);
                table.setWidthPercentage(100);
                
                String[] headers = {"Department", "Allocated Budget", "Used Budget", "Remaining"};
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                    cell.setBackgroundColor(new Color(63, 81, 181));
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    table.addCell(cell);
                }

                for (Budget b : budgets) {
                    BigDecimal remaining = b.getAllocatedAmount().subtract(b.getUsedAmount());
                    table.addCell(new PdfPCell(new Phrase(b.getDepartment(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase("$" + b.getAllocatedAmount(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase("$" + b.getUsedAmount(), bodyFont)));
                    table.addCell(new PdfPCell(new Phrase("$" + remaining, bodyFont)));
                }

                document.add(table);
            } else {
                // Default placeholder text for other reports
                Paragraph p = new Paragraph("This document details your analytical portfolio data compiled from the SubTrack AI scanning engine. Active details can be reviewed in your administrative panel.", bodyFont);
                document.add(p);
            }

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    private byte[] generateExcel(String type) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet(type.replace("_", " "));
        
        // Style Header
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        if ("SUBSCRIPTIONS".equals(type) || "MONTHLY_SPEND".equals(type)) {
            List<Subscription> subs = subscriptionRepository.findAll();
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] cols = {"ID", "Name", "Vendor", "Category", "Plan", "Cost", "Currency", "Billing Cycle", "Renewal Date", "Status"};
            
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Subscription s : subs) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getId());
                row.createCell(1).setCellValue(s.getName());
                row.createCell(2).setCellValue(s.getVendor().getName());
                row.createCell(3).setCellValue(s.getCategory());
                row.createCell(4).setCellValue(s.getPlan());
                row.createCell(5).setCellValue(s.getCost().doubleValue());
                row.createCell(6).setCellValue(s.getCurrency());
                row.createCell(7).setCellValue(s.getBillingCycle());
                row.createCell(8).setCellValue(s.getRenewalDate().toString());
                row.createCell(9).setCellValue(s.getStatus());
            }
        } else if ("BUDGETS".equals(type)) {
            List<Budget> budgets = budgetRepository.findAll();
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] cols = {"ID", "Department", "Allocated Amount", "Used Amount", "Start Date", "End Date"};
            
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Budget b : budgets) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.getDepartment());
                row.createCell(2).setCellValue(b.getAllocatedAmount().doubleValue());
                row.createCell(3).setCellValue(b.getUsedAmount().doubleValue());
                row.createCell(4).setCellValue(b.getStartDate().toString());
                row.createCell(5).setCellValue(b.getEndDate().toString());
            }
        } else {
            // General structure for empty export
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(0);
            cell.setCellValue("SubTrack Export Data");
            cell.setCellStyle(headerStyle);
        }

        // Autosize columns
        for (int i = 0; i < 10; i++) {
            try {
                sheet.autoSizeColumn(i);
            } catch (Exception ignored) {}
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        return out.toByteArray();
    }
}
