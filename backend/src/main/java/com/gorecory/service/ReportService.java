package com.gorecory.service;

import com.gorecory.model.Item;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ItemService itemService;

    public List<Map<String, Object>> getSalesData() {
        List<Map<String, Object>> data = new ArrayList<>();
        Object[][] rows = {
            {"Aug", 12500, 45}, {"Sep", 15200, 52}, {"Oct", 14800, 48},
            {"Nov", 18500, 61}, {"Dec", 22000, 75}, {"Jan", 19400, 68}
        };
        for (Object[] row : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("month", row[0]);
            m.put("revenue", row[1]);
            m.put("orders", row[2]);
            data.add(m);
        }
        return data;
    }

    public Map<String, List<Map<String, Object>>> getInventoryValue() {
        List<Item> items = itemService.getAllItems();

        Map<String, Double> byCategory = items.stream()
            .collect(Collectors.groupingBy(
                i -> i.getCategory() != null ? i.getCategory() : "Uncategorized",
                Collectors.summingDouble(i -> (i.getQuantity() != null && i.getPrice() != null)
                    ? i.getQuantity() * i.getPrice().doubleValue() : 0)
            ));

        Map<String, Double> byWarehouse = items.stream()
            .collect(Collectors.groupingBy(
                i -> i.getLocation() != null ? i.getLocation() : "Unknown",
                Collectors.summingDouble(i -> (i.getQuantity() != null && i.getPrice() != null)
                    ? i.getQuantity() * i.getPrice().doubleValue() : 0)
            ));

        List<Map<String, Object>> catList = byCategory.entrySet().stream()
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("category", e.getKey());
                m.put("value", e.getValue());
                return m;
            }).collect(Collectors.toList());

        List<Map<String, Object>> whList = byWarehouse.entrySet().stream()
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("warehouse", e.getKey());
                m.put("value", e.getValue());
                return m;
            }).collect(Collectors.toList());

        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        result.put("byCategory", catList);
        result.put("byWarehouse", whList);
        return result;
    }

    public List<Map<String, Object>> getTopItems() {
        return itemService.getAllItems().stream()
            .sorted((a, b) -> {
                double va = (a.getQuantity() != null && a.getPrice() != null)
                    ? a.getQuantity() * a.getPrice().doubleValue() : 0;
                double vb = (b.getQuantity() != null && b.getPrice() != null)
                    ? b.getQuantity() * b.getPrice().doubleValue() : 0;
                return Double.compare(vb, va);
            })
            .limit(10)
            .map(i -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", i.getId());
                m.put("name", i.getName() != null ? i.getName() : "");
                m.put("sku", i.getSku() != null ? i.getSku() : "");
                m.put("quantity", i.getQuantity() != null ? i.getQuantity() : 0);
                m.put("price", i.getPrice() != null ? i.getPrice() : 0);
                return m;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getLowStock() {
        return itemService.getAllItems().stream()
            .filter(i -> i.getQuantity() != null && i.getReorderLevel() != null
                && i.getQuantity() < i.getReorderLevel())
            .map(i -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", i.getId());
                m.put("name", i.getName() != null ? i.getName() : "");
                m.put("sku", i.getSku() != null ? i.getSku() : "");
                m.put("quantity", i.getQuantity());
                m.put("reorder_level", i.getReorderLevel());
                return m;
            })
            .collect(Collectors.toList());
    }
}
