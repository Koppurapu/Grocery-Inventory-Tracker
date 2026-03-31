package com.gorecory.service;

import com.gorecory.model.Warehouse;
import com.gorecory.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WarehouseService {
    
    @Autowired
    private WarehouseRepository warehouseRepository;
    
    public List<Warehouse> getAllWarehouses() { return warehouseRepository.findAll(); }
    public Warehouse getWarehouse(Long id) { return warehouseRepository.findById(id).orElse(null); }
    public Warehouse createWarehouse(Warehouse warehouse) { return warehouseRepository.save(warehouse); }
    public Warehouse updateWarehouse(Long id, Warehouse warehouse) { 
        warehouse.setId(id); 
        return warehouseRepository.save(warehouse); 
    }
    public void deleteWarehouse(Long id) { warehouseRepository.deleteById(id); }
    public long count() { return warehouseRepository.count(); }
}