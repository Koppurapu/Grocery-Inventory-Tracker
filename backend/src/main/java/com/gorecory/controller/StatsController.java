package com.gorecory.controller;

import com.gorecory.model.Item;
import com.gorecory.model.Order;
import com.gorecory.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StatsController {

    @Autowired
    private ItemService itemService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CustomerService customerService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Item> items = itemService.getAllItems();
        List<Order> orders = orderService.getAllOrders();

        int totalItems = items.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
        double totalValue = items.stream().mapToDouble(i -> (i.getQuantity() != null && i.getPrice() != null) ? i.getQuantity() * i.getPrice().doubleValue() : 0).sum();
        long lowStockItems = items.stream().filter(i -> i.getQuantity() != null && i.getReorderLevel() != null && i.getQuantity() < i.getReorderLevel()).count();
        long outOfStock = items.stream().filter(i -> i.getQuantity() != null && i.getQuantity() == 0).count();
        long totalOrders = orders.size();
        long pendingOrders = orders.stream().filter(o -> "Pending".equals(o.getStatus()) || "Processing".equals(o.getStatus())).count();
        double revenue = orders.stream().mapToDouble(o -> o.getTotal() != null ? o.getTotal().doubleValue() : 0).sum();
        long totalCustomers = customerService.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalItems", totalItems);
        stats.put("totalValue", totalValue);
        stats.put("lowStockItems", lowStockItems);
        stats.put("outOfStock", outOfStock);
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("revenue", revenue);
        stats.put("totalCustomers", totalCustomers);

        return ResponseEntity.ok(stats);
    }
}
