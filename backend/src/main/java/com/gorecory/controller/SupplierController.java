package com.gorecory.controller;

import com.gorecory.model.Supplier;
import com.gorecory.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    
    @Autowired
    private SupplierService supplierService;
    
    @GetMapping public List<Supplier> getSuppliers() { return supplierService.getAllSuppliers(); }
    @GetMapping("/{id}") public ResponseEntity<Supplier> getSupplier(@PathVariable Long id) { return ResponseEntity.ok(supplierService.getSupplier(id)); }
    @PostMapping public Supplier createSupplier(@RequestBody Supplier supplier) { return supplierService.createSupplier(supplier); }
    @PutMapping("/{id}") public Supplier updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) { return supplierService.updateSupplier(id, supplier); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) { supplierService.deleteSupplier(id); return ResponseEntity.ok().build(); }
}