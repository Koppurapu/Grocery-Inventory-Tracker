package com.gorecory.service;

import com.gorecory.model.Supplier;
import com.gorecory.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SupplierService {
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    public List<Supplier> getAllSuppliers() { return supplierRepository.findAll(); }
    public Supplier getSupplier(Long id) { return supplierRepository.findById(id).orElse(null); }
    public Supplier createSupplier(Supplier supplier) { return supplierRepository.save(supplier); }
    public Supplier updateSupplier(Long id, Supplier supplier) { 
        supplier.setId(id); 
        return supplierRepository.save(supplier); 
    }
    public void deleteSupplier(Long id) { supplierRepository.deleteById(id); }
    public long count() { return supplierRepository.count(); }
}