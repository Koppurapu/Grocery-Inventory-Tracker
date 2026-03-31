package com.gorecory.controller;

import com.gorecory.model.Warehouse;
import com.gorecory.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {
    
    @Autowired
    private WarehouseService warehouseService;
    
    @GetMapping
    public List<Warehouse> getWarehouses() { return warehouseService.getAllWarehouses(); }
    
    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getWarehouse(@PathVariable Long id) {
        Warehouse warehouse = warehouseService.getWarehouse(id);
        return warehouse != null ? ResponseEntity.ok(warehouse) : ResponseEntity.notFound().build();
    }
    
    @PostMapping
    public Warehouse createWarehouse(@RequestBody Warehouse warehouse) { return warehouseService.createWarehouse(warehouse); }
    
    @PutMapping("/{id}")
    public Warehouse updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) { return warehouseService.updateWarehouse(id, warehouse); }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable Long id) { warehouseService.deleteWarehouse(id); return ResponseEntity.ok().build(); }
}