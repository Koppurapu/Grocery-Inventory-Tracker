package com.gorecory.service;

import com.gorecory.model.Item;
import com.gorecory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ItemService {
    
    @Autowired
    private ItemRepository itemRepository;
    
    public List<Item> getAllItems() { return itemRepository.findAll(); }
    
    public List<Item> getItems(String category, String status, String search) {
        if (search != null && !search.isEmpty()) {
            return itemRepository.findByNameContainingOrSkuContaining(search, search);
        }
        if (category != null && !category.isEmpty()) {
            return itemRepository.findByCategory(category);
        }
        if (status != null && !status.isEmpty()) {
            return itemRepository.findByStatus(status);
        }
        return itemRepository.findAll();
    }
    
    public Item getItem(Long id) { return itemRepository.findById(id).orElse(null); }
    
    public Item createItem(Item item) {
        item.setStatus(getStatus(item.getQuantity(), item.getReorderLevel()));
        item.setLastUpdated(LocalDate.now());
        return itemRepository.save(item);
    }
    
    public Item updateItem(Long id, Item item) {
        item.setId(id);
        item.setStatus(getStatus(item.getQuantity(), item.getReorderLevel()));
        item.setLastUpdated(LocalDate.now());
        return itemRepository.save(item);
    }
    
    public void deleteItem(Long id) { itemRepository.deleteById(id); }
    
    public Integer getTotalQuantity() {
        return itemRepository.findAll().stream()
            .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0)
            .sum();
    }
    
    public Double getTotalValue() {
        return itemRepository.findAll().stream()
            .mapToDouble(i -> (i.getQuantity() != null && i.getPrice() != null) ? i.getQuantity() * i.getPrice().doubleValue() : 0)
            .sum();
    }
    
    public Integer getLowStockCount() {
        return (int) itemRepository.findAll().stream()
            .filter(i -> i.getQuantity() != null && i.getReorderLevel() != null && i.getQuantity() < i.getReorderLevel())
            .count();
    }
    
    private String getStatus(Integer quantity, Integer reorderLevel) {
        if (quantity == null || quantity == 0) return "Out of Stock";
        if (reorderLevel != null && quantity < reorderLevel) return "Low Stock";
        return "In Stock";
    }
}