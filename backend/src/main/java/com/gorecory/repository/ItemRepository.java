package com.gorecory.repository;

import com.gorecory.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByCategory(String category);
    List<Item> findByStatus(String status);
    List<Item> findByNameContainingOrSkuContaining(String name, String sku);
}