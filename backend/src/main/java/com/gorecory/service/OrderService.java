package com.gorecory.service;

import com.gorecory.model.Order;
import com.gorecory.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    public List<Order> getAllOrders() { return orderRepository.findAll(); }
    
    public List<Order> getOrders(String status, String customer) {
        if (customer != null && !customer.isEmpty()) {
            return orderRepository.findByCustomerContaining(customer);
        }
        if (status != null && !status.isEmpty()) {
            return orderRepository.findByStatus(status);
        }
        return orderRepository.findAll();
    }
    
    public Order getOrder(String id) { return orderRepository.findById(id).orElse(null); }
    
    public Order createOrder(Order order) {
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId("ORD-" + System.currentTimeMillis());
        }
        if (order.getDate() == null) {
            order.setDate(LocalDate.now());
        }
        return orderRepository.save(order);
    }
    
    public Order updateOrder(String id, Order order) {
        order.setId(id);
        return orderRepository.save(order);
    }
    
    public long count() { return orderRepository.count(); }
    
    public Double getTotalRevenue() {
        return orderRepository.findAll().stream()
            .mapToDouble(o -> o.getTotal() != null ? o.getTotal().doubleValue() : 0)
            .sum();
    }
}