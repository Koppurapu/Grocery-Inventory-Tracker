package com.gorecory.service;

import com.gorecory.model.Customer;
import com.gorecory.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CustomerService {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    public List<Customer> getAllCustomers() { return customerRepository.findAll(); }
    
    public List<Customer> getCustomers(String search) {
        if (search != null && !search.isEmpty()) {
            return customerRepository.findByNameContainingOrEmailContaining(search, search);
        }
        return customerRepository.findAll();
    }
    
    public Customer getCustomer(Long id) { return customerRepository.findById(id).orElse(null); }
    
    public Customer createCustomer(Customer customer) { return customerRepository.save(customer); }
    
    public Customer updateCustomer(Long id, Customer customer) {
        customer.setId(id);
        return customerRepository.save(customer);
    }
    
    public void deleteCustomer(Long id) { customerRepository.deleteById(id); }
    
    public long count() { return customerRepository.count(); }
}