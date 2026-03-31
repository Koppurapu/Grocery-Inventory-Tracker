package com.gorecory.service;

import com.gorecory.model.PurchaseOrder;
import com.gorecory.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PurchaseOrderService {
    
    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;
    
    public List<PurchaseOrder> getAll() { return purchaseOrderRepository.findAll(); }
    
    public PurchaseOrder create(PurchaseOrder po) {
        if (po.getId() == null || po.getId().isEmpty()) {
            po.setId("PO-" + System.currentTimeMillis());
        }
        return purchaseOrderRepository.save(po);
    }
    
    public PurchaseOrder update(String id, PurchaseOrder po) {
        po.setId(id);
        return purchaseOrderRepository.save(po);
    }
}