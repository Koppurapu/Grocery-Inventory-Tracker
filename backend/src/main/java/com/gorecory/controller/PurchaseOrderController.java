package com.gorecory.controller;

import com.gorecory.model.PurchaseOrder;
import com.gorecory.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {
    
    @Autowired
    private PurchaseOrderService purchaseOrderService;
    
    @GetMapping
    public List<PurchaseOrder> getPurchaseOrders() { return purchaseOrderService.getAll(); }
    
    @PostMapping
    public PurchaseOrder create(@RequestBody PurchaseOrder po) { return purchaseOrderService.create(po); }
    
    @PutMapping("/{id}")
    public PurchaseOrder update(@PathVariable String id, @RequestBody PurchaseOrder po) { return purchaseOrderService.update(id, po); }
}