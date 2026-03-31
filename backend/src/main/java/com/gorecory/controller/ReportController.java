package com.gorecory.controller;

import com.gorecory.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    @GetMapping("/sales")
    public List<Map<String, Object>> getSalesData() { return reportService.getSalesData(); }
    
    @GetMapping("/inventory-value")
    public Map<String, List<Map<String, Object>>> getInventoryValue() { return reportService.getInventoryValue(); }
    
    @GetMapping("/top-items")
    public List<Map<String, Object>> getTopItems() { return reportService.getTopItems(); }
    
    @GetMapping("/low-stock")
    public List<Map<String, Object>> getLowStock() { return reportService.getLowStock(); }
}